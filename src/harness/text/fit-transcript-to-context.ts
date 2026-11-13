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
     * The working context (`grabContextBudgetTokens`): the most the prompt
     * may be per turn, whatever the window. Left out, only the window
     * limits it.
     */
    budget_tokens?: number;
    /**
     * Characters of the tool definitions sent with every turn: they count
     * against the budget like the prompt.
     */
    tools_chars?: number;
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
 * Once over budget, trimming goes on down to this share of it. Cutting in
 * one block, rather than one message each turn, keeps the start of the
 * prompt the same for many turns, which is what providers cache.
 */
const TrimToShare = 0.6;
/**
 * Rough characters per token, on the low side so the estimate errs high.
 */
const CharsPerToken = 3;
/**
 * What an image or audio part is counted as, in tokens.
 */
const MediaTokens = 1500;
/**
 * Characters of a trimmed tool result that are kept at each end. A trimmed
 * result used to be replaced whole, with a note telling the model to call
 * the tool again if it still needed it, so it did: the same `SELECT`, the
 * same `cat`, re-run and resent. Keeping the start and the end (the command
 * and its totals, as `truncate` does) is usually all the run still needs.
 */
const TrimmedKeepChars = 500;
/**
 * Tool call arguments longer than this (a file written whole) are cut on
 * the second pass, after the tool results.
 */
const ArgumentsKeepChars = 1500;

/**
 * Keeps a long tool run inside its working context: once the estimated
 * prompt (system, tool definitions, transcript) passes the budget (the
 * working context, or 70% of the window when that is smaller), the
 * oldest tool results, then long tool call arguments, then the oldest
 * assistant texts are replaced with a note of what was cut, down to 60%
 * of the budget. Returns how many messages were trimmed.
 */
export default function fitTranscriptToContext({
    system,
    transcript,
    context_length,
    budget_tokens,
    tools_chars = 0,
    keep_last = 4,
}: Params) {
    const window_budget = Math.floor(context_length * PromptShare);
    const budget = budget_tokens && budget_tokens > 0 ? Math.min(window_budget, budget_tokens) : window_budget;
    let total =
        estimateTokens({ text: system }) +
        Math.ceil(tools_chars / CharsPerToken) +
        transcript.reduce((sum, m) => sum + messageTokens({ message: m }), 0);
    let trimmed = 0;

    if (total <= budget) return { trimmed, estimated_tokens: total, budget };

    const target = Math.floor(budget * TrimToShare);
    const trimmable = transcript.length - keep_last;
    const names = toolNames({ transcript });

    const replace = ({ index, message }: { index: number; message: HarnessMessage }) => {
        const before = messageTokens({ message: transcript[index]! });

        transcript[index] = message;
        total += messageTokens({ message }) - before;
        trimmed++;
    };

    /**
     * A tool result cut down to its two ends and a note: the run works from
     * what it kept, rather than paying for the call again.
     */
    const trimResult = ({ index, content, name }: { index: number; content: string; name: string | undefined }) => {
        const kept = content.length > TrimmedKeepChars * 4;
        const head = kept ? content.slice(0, TrimmedKeepChars) : "";
        const tail = kept ? content.slice(-TrimmedKeepChars) : "";
        const cut = content.length - head.length - tail.length;
        const label = name ? `${name} output` : "tool output";

        if (!kept) return `[Trimmed: ${cut} characters of this ${label} to fit the working context.]`;

        const note = `[Trimmed: ${cut} characters of the middle of this ${label} to fit the working context. Its start and end are kept here: work from them, and narrow the call (a smaller range, a filter, one row) rather than repeating it.]`;

        return `${head}\n\n${note}\n\n${tail}`;
    };

    for (let index = 0; index < trimmable && total > target; index++) {
        const message = transcript[index]!;

        if (message.role != "tool" || isTrimmed({ text: message.content })) continue;

        const name = names.get(message.tool_call_id);

        replace({
            index,
            message: {
                ...message,
                content: trimResult({ index, content: message.content, name }),
            },
        });
    }

    for (let index = 0; index < trimmable && total > target; index++) {
        const message = transcript[index]!;

        if (message.role != "assistant" || !message.tool_calls?.some((call) => call.arguments.length > ArgumentsKeepChars)) {
            continue;
        }

        replace({
            index,
            message: {
                ...message,
                tool_calls: message.tool_calls.map((call) =>
                    call.arguments.length > ArgumentsKeepChars
                        ? {
                              ...call,
                              arguments: JSON.stringify({
                                  trimmed: `${call.arguments.length} characters of arguments cut to fit the working context`,
                              }),
                          }
                        : call,
                ),
            },
        });
    }

    for (let index = 0; index < trimmable && total > target; index++) {
        const message = transcript[index]!;

        if (message.role != "assistant" || typeof message.content != "string" || isTrimmed({ text: message.content })) {
            continue;
        }

        replace({
            index,
            message: {
                ...message,
                content: `[Trimmed: ${message.content.length} characters of earlier notes to fit the working context.]`,
            },
        });
    }

    return { trimmed, estimated_tokens: total, budget };
}

/**
 * The tool each call id went to, for the note that replaces its result.
 */
function toolNames({ transcript }: { transcript: HarnessMessage[] }) {
    const names = new Map<string, string>();

    for (const message of transcript) {
        if (message.role != "assistant") continue;

        for (const call of message.tool_calls || []) names.set(call.id, call.name);
    }

    return names;
}

function isTrimmed({ text }: { text: string }) {
    return text.startsWith("[Trimmed:");
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
