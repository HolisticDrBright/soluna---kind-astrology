// Pure helper for assembling the LLM message list for Ask Soluna.
//
// The handler persists the user's message BEFORE loading history (so it's never
// lost if the stream dies). That creates two hazards this function neutralizes:
//   1. Duplication — the just-saved message is also in the loaded history, so
//      naively appending the current message again sends it twice.
//   2. Loss — loading the OLDEST N messages drops the current one in long
//      conversations. We always load the most-recent N (chronological) and
//      guarantee the current message is the final turn, exactly once.

export interface RawMessage {
  id?: string | null;
  role: string;
  content: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * Build the chronological user/assistant turns to send to the model.
 * @param historyChrono recent messages in chronological (oldest→newest) order
 * @param currentMessage the message the user just sent
 * @param currentMessageId id of the just-persisted row (so we can exclude it)
 */
export function buildChatMessages(
  historyChrono: RawMessage[],
  currentMessage: string,
  currentMessageId?: string | null,
): ChatMessage[] {
  const prior = historyChrono
    .filter((m) => m.role === "user" || m.role === "assistant")
    // Drop the just-inserted row by id so it isn't doubled.
    .filter((m) => !(currentMessageId && m.id === currentMessageId))
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  // Defensive: if the id wasn't captured, still strip a trailing user turn that
  // is exactly the current message, so it can never be sent twice.
  while (
    prior.length &&
    prior[prior.length - 1].role === "user" &&
    prior[prior.length - 1].content === currentMessage
  ) {
    prior.pop();
  }

  prior.push({ role: "user", content: currentMessage });
  return prior;
}
