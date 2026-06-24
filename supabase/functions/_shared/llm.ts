// Provider-agnostic LLM client.
//
// PRIVACY: we call a no-training / zero-retention endpoint only. Anthropic does
// not train on API traffic; if you route through a zero-retention gateway set
// LLM_BASE_URL. We never log raw prompts or completions to third parties — only
// metadata (model, token counts, latency) via the caller.
//
// Every call automatically prepends SOLUNA_VOICE so tone + wellbeing guardrails
// can never be omitted.

import type { ZodSchema } from "zod";
import { JSON_OUTPUT_RULE, SOLUNA_VOICE } from "./voice.ts";

export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CompleteOpts {
  /** Extra system text, appended AFTER the immutable SOLUNA_VOICE block. */
  system?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
  /** Metadata-only usage callback (no raw content) for audit logging. */
  onUsage?: (u: LLMUsage) => void;
}

export interface LLMUsage {
  model: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export class LLMUnavailableError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "LLMUnavailableError";
  }
}

type Provider = "anthropic" | "openai";

function cfg() {
  const provider = (Deno.env.get("LLM_PROVIDER") ?? "anthropic") as Provider;
  const apiKey = Deno.env.get("LLM_API_KEY") ?? "";
  const model = Deno.env.get("LLM_MODEL") ?? "claude-sonnet-4-6";
  const baseUrl = Deno.env.get("LLM_BASE_URL") ??
    (provider === "anthropic" ? "https://api.anthropic.com" : "https://api.openai.com");
  return { provider, apiKey, model, baseUrl };
}

function fullSystem(extra?: string): string {
  return extra ? `${SOLUNA_VOICE}\n\n${extra}` : SOLUNA_VOICE;
}

export class LLMClient {
  private now() {
    // Date.now is fine in Edge runtime (only the Workflow sandbox forbids it).
    return Date.now();
  }

  /** One-shot completion → plain text. */
  async complete(messages: LLMMessage[], opts: CompleteOpts = {}): Promise<string> {
    const { provider, apiKey, model, baseUrl } = cfg();
    if (!apiKey) throw new LLMUnavailableError("LLM_API_KEY is not set");
    const useModel = opts.model ?? model;
    const started = this.now();

    if (provider === "anthropic") {
      const res = await fetch(`${baseUrl}/v1/messages`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: useModel,
          max_tokens: opts.maxTokens ?? 1024,
          temperature: opts.temperature ?? 0.6,
          system: fullSystem(opts.system),
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!res.ok) {
        throw new LLMUnavailableError(`anthropic ${res.status}: ${await safeBody(res)}`);
      }
      const json = await res.json();
      opts.onUsage?.({
        model: useModel,
        inputTokens: json.usage?.input_tokens ?? 0,
        outputTokens: json.usage?.output_tokens ?? 0,
        latencyMs: this.now() - started,
      });
      return (json.content ?? []).map((c: { text?: string }) => c.text ?? "").join("").trim();
    }

    // OpenAI-compatible
    const res = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: useModel,
        max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.6,
        messages: [{ role: "system", content: fullSystem(opts.system) }, ...messages],
      }),
    });
    if (!res.ok) throw new LLMUnavailableError(`openai ${res.status}: ${await safeBody(res)}`);
    const json = await res.json();
    opts.onUsage?.({
      model: useModel,
      inputTokens: json.usage?.prompt_tokens ?? 0,
      outputTokens: json.usage?.completion_tokens ?? 0,
      latencyMs: this.now() - started,
    });
    return (json.choices?.[0]?.message?.content ?? "").trim();
  }

  /**
   * JSON completion validated against a zod schema. Retries once with a
   * stricter nudge if the first parse/validation fails. Throws if both fail —
   * callers should catch and use a safe fallback.
   */
  async completeJSON<T>(
    messages: LLMMessage[],
    schema: ZodSchema<T>,
    opts: CompleteOpts = {},
  ): Promise<T> {
    const sys = `${opts.system ?? ""}\n\n${JSON_OUTPUT_RULE}`.trim();
    for (let attempt = 0; attempt < 2; attempt++) {
      const raw = await this.complete(messages, {
        ...opts,
        system: attempt === 0 ? sys : `${sys}\n\nYour previous reply was not valid JSON. Return JSON only.`,
        temperature: opts.temperature ?? 0.4,
      });
      const parsed = tryParseJSON(raw);
      if (parsed !== undefined) {
        const result = schema.safeParse(parsed);
        if (result.success) return result.data;
      }
    }
    throw new LLMUnavailableError("model did not return schema-valid JSON");
  }

  /**
   * Streaming completion → async iterable of text deltas. The `ask` Edge
   * Function re-emits these as SSE to the client.
   */
  async *stream(messages: LLMMessage[], opts: CompleteOpts = {}): AsyncGenerator<string> {
    const { provider, apiKey, model, baseUrl } = cfg();
    if (!apiKey) throw new LLMUnavailableError("LLM_API_KEY is not set");
    const useModel = opts.model ?? model;

    const url = provider === "anthropic"
      ? `${baseUrl}/v1/messages`
      : `${baseUrl}/v1/chat/completions`;
    const headers: Record<string, string> = provider === "anthropic"
      ? { "content-type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" }
      : { "content-type": "application/json", authorization: `Bearer ${apiKey}` };
    const body = provider === "anthropic"
      ? {
        model: useModel,
        max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.6,
        system: fullSystem(opts.system),
        stream: true,
        messages,
      }
      : {
        model: useModel,
        max_tokens: opts.maxTokens ?? 1024,
        temperature: opts.temperature ?? 0.6,
        stream: true,
        messages: [{ role: "system", content: fullSystem(opts.system) }, ...messages],
      };

    const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok || !res.body) {
      throw new LLMUnavailableError(`stream ${res.status}: ${await safeBody(res)}`);
    }

    const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
    let buffer = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const data = trimmed.slice(5).trim();
        if (data === "[DONE]") return;
        const delta = extractDelta(provider, data);
        if (delta) yield delta;
      }
    }
  }
}

function extractDelta(provider: Provider, data: string): string {
  try {
    const json = JSON.parse(data);
    if (provider === "anthropic") {
      if (json.type === "content_block_delta") return json.delta?.text ?? "";
      return "";
    }
    return json.choices?.[0]?.delta?.content ?? "";
  } catch {
    return "";
  }
}

function tryParseJSON(raw: string): unknown {
  // Tolerate accidental code fences or leading prose.
  const cleaned = raw.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;
  try {
    return JSON.parse(slice);
  } catch {
    return undefined;
  }
}

async function safeBody(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 300);
  } catch {
    return "<no body>";
  }
}

export const llm = new LLMClient();
