import type { BotJobUpdateKind } from "@/src/dict/bot-queue-dict";
import type { TextLoopStep } from "@/src/harness/text/run-text-loop";

/**
 * Longest step line kept: the panel shows one line per step.
 */
const MaxStepChars = 200;

/**
 * One model turn as a `bots_queue_updates` row: the tools it called, or
 * the first line of what it wrote. Null for an empty turn. Never the tool
 * arguments, which can hold anything the bot typed.
 */
export default function describeJobStep({
    text,
    tool_calls,
    index,
    candidate,
}: TextLoopStep): {
    kind: BotJobUpdateKind;
    text: string;
    metadata: Record<string, unknown>;
} | null {
    const metadata = { step: index, model: candidate.model.slug };

    if (tool_calls.length) {
        const tools = [...new Set(tool_calls.map((call) => call.name))];

        return {
            kind: "tool",
            text: `Using ${tools.join(", ")}`,
            metadata: { ...metadata, tools },
        };
    }

    const line = text?.trim().split("\n").find((l) => l.trim())?.trim();

    if (!line) return null;

    return {
        kind: "note",
        text: line.length > MaxStepChars ? `${line.slice(0, MaxStepChars - 1)}…` : line,
        metadata,
    };
}
