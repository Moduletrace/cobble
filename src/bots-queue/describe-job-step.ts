import {
    JobStepToolLabels,
    JobStepToolPrefixLabels,
    type BotJobUpdateKind,
} from "@/src/dict/bot-queue-dict";
import type { TextLoopStep } from "@/src/harness/text/run-text-loop";

/**
 * Longest step line kept: the chat shows one line per step.
 */
const MaxStepChars = 200;

/**
 * One model turn as a `bots_queue_updates` row, read by the user while the
 * bot works: the first line the model wrote (models often say what
 * they're about to do), else what its tools do in plain words. Null for an
 * empty turn. Never the tool arguments, which can hold anything the bot
 * typed.
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
    const line = firstLine({ text });

    if (tool_calls.length) {
        const tools = [...new Set(tool_calls.map((call) => call.name))];
        const labels = [...new Set(tools.map((name) => toolLabel({ name })))];

        return {
            kind: "tool",
            text: line || labels.join(", "),
            metadata: { ...metadata, tools },
        };
    }

    if (!line) return null;

    return { kind: "note", text: line, metadata };
}

function firstLine({ text }: { text: string | null }) {
    const line = text?.trim().split("\n").find((l) => l.trim())?.trim();

    if (!line) return null;

    return line.length > MaxStepChars ? `${line.slice(0, MaxStepChars - 1)}…` : line;
}

function toolLabel({ name }: { name: string }) {
    const prefix = Object.keys(JobStepToolPrefixLabels).find((p) => name.startsWith(p));

    return JobStepToolLabels[name] || (prefix && JobStepToolPrefixLabels[prefix]) || `Using ${readableToolName({ name })}`;
}

/**
 * A tool name in words: `get_weather` reads "get weather", and an MCP
 * server's `<slug>__<tool>` reads "Exa search (web search exa)".
 */
function readableToolName({ name }: { name: string }) {
    const words = (part: string) => part.replace(/_+/g, " ").trim();
    const [server, ...rest] = name.split("__");
    const tool = words(rest.join(" "));

    if (!tool) return words(name);

    const server_words = words(server || "");

    return `${server_words.charAt(0).toUpperCase()}${server_words.slice(1)} (${tool})`;
}
