import type { HarnessMessage } from "../types";

type Params = {
    system: string;
    /**
     * The conversation after the system prompt. Trimmed in place, so the
     * run keeps the savings.
     */
    transcript: HarnessMessage[];
    /**
     * The working context (`workingContextTokens`): the most a turn may
     * send, the model's window less the room its answer needs, or the
     * install's own tighter cap.
     */
    working_tokens: number;
    /**
     * Characters of the tool definitions sent with every turn: they count
     * against the budget like the prompt.
     */
    tools_chars?: number;
    /**
     * The newest messages: the passes that cut everything else leave them
     * alone, so the turn the run is working from keeps its answer. Only the
     * last resort (still over budget with nothing older left to cut) cuts
     * their tool results, and what the user wrote is never cut at all.
     */
    keep_last?: number;
};

/**
 * Why the prompt still doesn't fit:
 * - `static`: the system prompt and tool definitions alone are past the
 *   working context, so no amount of trimming can help and the run must
 *   stop and say so
 * - `request`: what is over is the conversation itself, most often what
 *   the user wrote, which is never cut
 */
export type OverBudgetCause = "static" | "request";

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
 * A result no longer than this is kept whole. Cutting it saved nothing
 * worth a note, and a short result used to be replaced by the note alone:
 * a 14-character answer from a shell reached the model as "Trimmed: 14
 * characters", so the run was reading nothing at all and went on doing it
 * for the rest of its steps.
 */
const ResultKeepWholeChars = TrimmedKeepChars * 4;
/**
 * Tool call arguments longer than this (a file written whole) are cut on
 * the second pass, after the tool results.
 */
const ArgumentsKeepChars = 1500;

/**
 * Keeps a long tool run inside its working context: once the estimated
 * prompt (system, tool definitions, transcript) passes it, the oldest tool
 * results, then long tool call arguments, then the oldest assistant texts
 * are replaced with a note of what was cut, down to 60% of it. The newest
 * turn's results are cut last, and only once everything older is gone.
 * Reports how many messages were trimmed, and, when the prompt still
 * doesn't fit, whether the static part is the cause.
 */
export default function fitTranscriptToContext({
    system,
    transcript,
    working_tokens,
    tools_chars = 0,
    keep_last = 4,
}: Params) {
    const budget = working_tokens;
    const system_tokens = estimateTokens({ text: system });
    const tools_tokens = Math.ceil(tools_chars / CharsPerToken);
    const base = system_tokens + tools_tokens;
    let total = base + transcript.reduce((sum, m) => sum + messageTokens({ message: m }), 0);
    let trimmed = 0;

    if (total <= budget) {
        return {
            trimmed,
            estimated_tokens: total,
            budget,
            base,
            system_tokens,
            tools_tokens,
            over_budget: false as false | OverBudgetCause,
        };
    }

    const target = Math.floor(budget * TrimToShare);
    const trimmable = transcript.length - keep_last;
    const names = toolNames({ transcript });
    /**
     * Everything after the newest user turn is what the run is working
     * from right now. Cutting it is the last resort, not the first: it is
     * why a run over budget kept its command and lost its answer.
     */
    const newest_turn = Math.max(
        0,
        Math.min(trimmable, transcript.reduce((last, message, index) => (message.role == "user" ? index : last), trimmable)),
    );

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
    const trimResult = ({ content, name }: { content: string; name: string | undefined }) => {
        const head = content.slice(0, TrimmedKeepChars);
        const tail = content.slice(-TrimmedKeepChars);
        const cut = content.length - head.length - tail.length;
        const label = name ? `${name} output` : "tool output";

        const note = `[Trimmed: ${cut} characters of the middle of this ${label} to fit the working context. Its start and end are kept here: work from them, and narrow the call (a smaller range, a filter, one row) rather than repeating it.]`;

        return `${head}\n\n${note}\n\n${tail}`;
    };

    const trimToolResult = ({ index }: { index: number }) => {
        const message = transcript[index]!;

        if (message.role != "tool" || isTrimmed({ text: message.content })) return;
        if (message.content.length <= ResultKeepWholeChars) return;

        const name = names.get(message.tool_call_id);

        replace({
            index,
            message: {
                ...message,
                content: trimResult({ content: message.content, name }),
            },
        });
    };

    for (let index = 0; index < newest_turn && total > target; index++) trimToolResult({ index });

    for (let index = 0; index < newest_turn && total > target; index++) {
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

    for (let index = 0; index < newest_turn && total > target; index++) {
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

    /**
     * The newest results were never cut, and a run still over budget with
     * nothing older to trim sent the whole prompt anyway: one 60k-character
     * sweep plus a pasted brief went out every turn, and every candidate
     * refused it. The newest results are what the run is working from, so
     * they are cut last, and only once everything older is gone. A user's
     * own text is never touched.
     */
    for (let index = newest_turn; index < transcript.length && total > target; index++) trimToolResult({ index });

    return {
        trimmed,
        estimated_tokens: total,
        budget,
        base,
        system_tokens,
        tools_tokens,
        over_budget: total > budget ? (base >= budget ? ("static" as const) : ("request" as const)) : (false as const),
    };
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
    // A result cut to its start and end keeps the head in front, so the
    // marker sits in the middle, not at the start: `startsWith` missed it
    // and the next pass cut the kept ends away into a bare stub, counting
    // the same message twice (M4). The marker anywhere means already cut.
    return text.includes("[Trimmed:");
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
