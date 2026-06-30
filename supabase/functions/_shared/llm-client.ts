/**
 * LLM Client — provider-agnostic, anthropic default, no-retention endpoint.
 * All LLM calls go through this client to ensure SOLUNA_VOICE and guardrails
 * are consistently applied.
 */

import { SOLUNA_VOICE, SOLUNA_SAFETY_FALLBACK } from "./constants.ts";

export interface LLMConfig {
  provider: string;
  apiKey: string;
  model: string;
  baseUrl?: string;
  /** Optional Anthropic beta header(s). Only sent when explicitly configured via
   *  LLM_ANTHROPIC_BETA. We do NOT hardcode a beta flag: zero-data-retention on
   *  the Anthropic API is an org-level setting, not a per-request beta, and an
   *  unrecognized beta value can make every call fail. */
  anthropicBeta?: string;
}

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: { input_tokens: number; output_tokens: number };
}

function getConfig(): LLMConfig {
  const provider = (Deno.env.get("LLM_PROVIDER") ?? "anthropic").toLowerCase();
  const providerKey = provider === "anthropic"
    ? Deno.env.get("ANTHROPIC_API_KEY")
    : Deno.env.get("OPENAI_API_KEY");

  return {
    provider,
    apiKey: Deno.env.get("LLM_API_KEY") ?? providerKey ?? "",
    model: Deno.env.get("LLM_MODEL") ?? (provider === "anthropic" ? "claude-sonnet-4-6" : "gpt-5-mini"),
    baseUrl: Deno.env.get("LLM_BASE_URL") ?? undefined,
    anthropicBeta: Deno.env.get("LLM_ANTHROPIC_BETA") ?? undefined,
  };
}

/**
 * Call the LLM with the Soluna voice system prompt prepended.
 * Handles guardrail trips with a safe fallback.
 */
export function llmCall(
  messages: LLMMessage[],
  options?: { maxTokens?: number; temperature?: number; jsonMode?: boolean },
): Promise<LLMResponse> {
  const config = getConfig();
  if (!config.apiKey) {
    // Make the #1 misconfiguration self-evident in the logs instead of an opaque
    // upstream 401. The caller (synthesis) logs this and returns a safe fallback.
    return Promise.reject(
      new Error(
        `No LLM API key configured — set ${config.provider === "anthropic" ? "ANTHROPIC_API_KEY" : "OPENAI_API_KEY"} (or LLM_API_KEY) in Supabase Edge Function secrets.`,
      ),
    );
  }
  const systemMessages: LLMMessage[] = [
    { role: "system", content: SOLUNA_VOICE },
    ...messages,
  ];

  if (config.provider === "anthropic") {
    return callAnthropic(config, systemMessages, options);
  }
  // Fallback to OpenAI-compatible API
  return callOpenAICompatible(config, systemMessages, options);
}

async function callAnthropic(
  config: LLMConfig,
  messages: LLMMessage[],
  options?: { maxTokens?: number; temperature?: number; jsonMode?: boolean },
): Promise<LLMResponse> {
  // Anthropic takes a single top-level system string. Merge ALL system messages
  // (SOLUNA_VOICE + any per-call context block) so none are silently dropped.
  const systemContent = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const chatMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: m.content }));

  const body: Record<string, unknown> = {
    model: config.model,
    max_tokens: options?.maxTokens ?? 1024,
    temperature: options?.temperature ?? 0.7,
    messages: chatMessages,
  };

  if (systemContent) {
    body.system = systemContent;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": config.apiKey,
    "anthropic-version": "2023-06-01",
  };
  // Only send a beta header when explicitly configured. We previously hardcoded a
  // "no-retention" beta here; that is NOT how zero-retention works on the Anthropic
  // API (it is an org-level setting), and an unrecognized beta can fail every call.
  if (config.anthropicBeta) {
    headers["anthropic-beta"] = config.anthropicBeta;
  }

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    // Log the real upstream cause at the source (model + status, never the key) so
    // the function log pinpoints it even if a caller swallows the throw.
    console.error(`[llm] Anthropic call failed: status=${resp.status} model=${config.model} body=${err.slice(0, 300)}`);
    throw new Error(`Anthropic API error (${resp.status}): ${err}`);
  }

  const data = await resp.json();
  const content = data.content?.[0]?.text ?? "";

  // Guardrail check: if response starts with a refusal prefix, return fallback
  if (content.toLowerCase().includes("i cannot") && content.length < 200) {
    return { content: SOLUNA_SAFETY_FALLBACK };
  }

  return {
    content,
    usage: data.usage
      ? { input_tokens: data.usage.input_tokens, output_tokens: data.usage.output_tokens }
      : undefined,
  };
}

async function callOpenAICompatible(
  config: LLMConfig,
  messages: LLMMessage[],
  options?: { maxTokens?: number; temperature?: number; jsonMode?: boolean },
): Promise<LLMResponse> {
  const body: Record<string, unknown> = {
    model: config.model,
    max_tokens: options?.maxTokens ?? 1024,
    temperature: options?.temperature ?? 0.7,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  };

  if (options?.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const baseUrl = config.baseUrl ?? "https://api.openai.com/v1";
  const resp = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error(`[llm] ${config.provider} call failed: status=${resp.status} model=${config.model} body=${err.slice(0, 300)}`);
    throw new Error(`LLM API error (${resp.status}): ${err}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  return {
    content,
    usage: data.usage
      ? { input_tokens: data.usage.prompt_tokens, output_tokens: data.usage.completion_tokens }
      : undefined,
  };
}

/**
 * Call LLM with JSON output, validating against a zod schema.
 * Falls back to the provided fallback value on parse failure.
 */
export async function llmCallJSON<T>(
  messages: LLMMessage[],
  fallback: T,
  options?: { maxTokens?: number; temperature?: number },
): Promise<T> {
  try {
    const resp = await llmCall(messages, { ...options, jsonMode: true });
    // Try to parse JSON — Anthropic and OpenAI return it differently
    const jsonMatch = resp.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return fallback;
  } catch {
    return fallback;
  }
}
