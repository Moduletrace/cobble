/**
 * The shapes providers use when the prompt was too long for the model it
 * was sent to. Their message carries the real limit and what was sent
 * ("prompt is too long: 1,038,402 tokens > 1,000,000 maximum"), which is
 * the only place a model with no declared window states its window.
 */
const ContextOverflowPhrases = [
    "maximum context length",
    "context length exceeded",
    "context_length_exceeded",
    "prompt is too long",
    "reduce the length of the messages",
    "input length and max_tokens exceed",
    "exceeds the maximum number of tokens",
    "maximum number of input tokens",
];

/**
 * "1,038,402 tokens > 1,000,000 maximum": a count compared against a
 * limit, which no other kind of 400 phrases that way.
 */
const OverLimitTokens = /\b\d[\d,]{2,}\s*tokens?\b[^.]{0,30}\b(maximum|max|limit)\b/;

type Params = {
    status: number;
    /**
     * The provider's own words, already read out of its error body.
     */
    detail?: string;
};

/**
 * Whether a provider refused a call because the prompt did not fit its
 * model. A 400 usually means "only another model can help", but this one
 * means the window this run was sized for is too big: no fallback model
 * and no retry fixes it, and the message says what the real limit is
 * (`isContextOverflowError` -> `toHarnessError`).
 */
export default function isContextOverflowError({ status, detail }: Params) {
    if (status != 400 && status != 413 && status != 422) return false;

    const text = (detail || "").toLowerCase();

    return ContextOverflowPhrases.some((phrase) => text.includes(phrase)) || OverLimitTokens.test(text);
}
