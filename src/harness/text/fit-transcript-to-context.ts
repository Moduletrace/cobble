import type { HarnessMessage } from "../types";

type Params = {
    system: string;
    /**
     * The conversation after the system prompt. Trimmed in place, so the
     * run keeps the savings.
     */
    transcript: HarnessMessage[];
    /**
     * The model's context window, in tokens.
     */
    context_length: number;
    /**
     * The newest messages, never trimmed: the model needs them to go on.
     */
    keep_last?: number;
};

/**
 * Share of the window the prompt may fill; the rest is for the answer.
 */
const PromptShare = 0.7;
/**
 * Rough characters per token, on the low side so the estimate errs high.
 */
const CharsPerToken = 3;
/**
 * What an image or audio part is counted as, in tokens.
 */
const MediaTokens = 1500;

/**
 * Keeps a long tool run inside the model's context window: while the
 * estimated prompt is over budget, the oldest tool results (then the
 * oldest assistant texts) are replaced with a note of what was cut.
 * Returns how many messages were trimmed.
 */
export default function fitTranscriptToContext({
    system,
    transcript,
    context_length,
    keep_last = 4,
}: Params) {
    const budget = Math.floor(context_length * PromptShare);
    let total = estimateTokens({ text: system }) + transcript.reduce((sum, m) => sum + messageTokens({ message: m }), 0);
    let trimmed = 0;

    const trimmable = transcript.length - keep_last;

    for (const role of ["tool", "assistant"] as const) {
        for (let index = 0; index < trimmable && total > budget; index++) {
            const message = transcript[index]!;

            if (message.role != role || typeof message.content != "string") continue;
            if (message.content.startsWith("[Trimmed:")) continue;

            const before = messageTokens({ message });
            const note = `[Trimmed: ${message.content.length} characters of earlier ${role == "tool" ? "tool output" : "notes"} to fit the context.]`;

            transcript[index] = { ...message, content: note } as HarnessMessage;
            total += messageTokens({ message: transcript[index]! }) - before;
            trimmed++;
        }
    }

    return { trimmed, estimated_tokens: total, budget };
}

function messageTokens({ message }: { message: HarnessMessage }) {
    let tokens = 4;

    if (typeof message.content == "string") {
        tokens += estimateTokens({ text: message.content });
    } else if (Array.isArray(message.content)) {
        for (const part of message.content) {
            tokens += part.type == "text" ? estimateTokens({ text: part.text }) : MediaTokens;
        }
    }

    if (message.role == "assistant" && message.tool_calls) {
        for (const call of message.tool_calls) {
            tokens += estimateTokens({ text: call.name + call.arguments });
        }
    }

    return tokens;
}

function estimateTokens({ text }: { text: string }) {
    return Math.ceil(text.length / CharsPerToken);
}
