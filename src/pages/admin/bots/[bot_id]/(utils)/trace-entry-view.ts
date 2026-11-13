import type { BotTraceRow } from "@/src/types";

export type TraceEntryView = {
    /**
     * What the entry is: the turn's number, the tool's name or the event.
     */
    title: string;
    /**
     * Short values shown beside the title (model, tokens, how long).
     */
    meta: string[];
    /**
     * What the turn answered, or what the event was.
     */
    text?: string;
    reasoning?: string;
    /**
     * The JSON the model sent the tool.
     */
    arguments?: string;
    /**
     * What the tool answered.
     */
    result?: string;
    /**
     * How long the turn took to answer or the call to run, in words.
     */
    duration?: string;
    /**
     * What the turn asked the tools for, by name.
     */
    tools?: string[];
    failed: boolean;
};

/**
 * How much of a long text the debug view shows before it opens it whole.
 */
export const TracePreviewChars = 1200;

/**
 * The names `server` events trace as, in words: what the loop did around
 * its turns, which a bot's answer never shows.
 */
const EventTitles: Record<string, string> = {
    wrap_up: "Out of room: last turn",
    redraft: "Answer written again",
    review: "Answer sent back",
    incoming: "The user wrote again",
    steps_low: "Steps running out",
};

type Metadata = {
    index?: number;
    model?: string | null;
    provider?: string | null;
    finish_reason?: string | null;
    duration_ms?: number;
    tools?: string[];
    ok?: boolean;
    images?: number;
    repeat_of?: number | null;
};

function readMetadata({ entry }: { entry: BotTraceRow }): Metadata {
    if (!entry.metadata) return {};

    try {
        const parsed = JSON.parse(entry.metadata);

        return parsed && typeof parsed == "object" ? (parsed as Metadata) : {};
    } catch {
        return {};
    }
}

function durationLabel({ duration_ms }: { duration_ms?: number }) {
    if (typeof duration_ms != "number" || duration_ms <= 0) return null;
    if (duration_ms < 1000) return `${duration_ms}ms`;

    return `${(duration_ms / 1000).toFixed(1)}s`;
}

function turnMeta({ metadata }: { metadata: Metadata }) {
    const meta: string[] = [];

    if (metadata.model) meta.push(metadata.model);

    const duration = durationLabel({ duration_ms: metadata.duration_ms });

    if (duration) meta.push(duration);

    if (metadata.tools?.length) meta.push(`${metadata.tools.length} tools`);

    if (metadata.finish_reason && metadata.finish_reason != "stop")
        meta.push(metadata.finish_reason);

    return meta;
}

function toolMeta({ metadata }: { metadata: Metadata }) {
    const meta: string[] = [];
    const duration = durationLabel({ duration_ms: metadata.duration_ms });

    if (duration) meta.push(duration);

    if (metadata.images) meta.push(`${metadata.images} images`);

    if (metadata.repeat_of != null) meta.push("already read");

    return meta;
}

/**
 * A trace entry as the debug view draws it: its title, the small values
 * beside it and the text it holds, without any of the shape the three
 * kinds differ in.
 */
export default function traceEntryView({ entry }: { entry: BotTraceRow }): TraceEntryView {
    const metadata = readMetadata({ entry });

    if (entry.kind == "tool")
        return {
            title: entry.name || "Tool call",
            meta: toolMeta({ metadata }),
            arguments: entry.arguments || undefined,
            result: entry.result || undefined,
            duration: durationLabel({ duration_ms: metadata.duration_ms }) || undefined,
            failed: metadata.ok === false,
        };

    if (entry.kind == "event")
        return {
            title: EventTitles[entry.name || ""] || entry.name || "Event",
            meta: [],
            text: entry.text || undefined,
            failed: false,
        };

    return {
        title: `Turn ${(metadata.index ?? 0) + 1}`,
        meta: turnMeta({ metadata }),
        text: entry.text || undefined,
        duration: durationLabel({ duration_ms: metadata.duration_ms }) || undefined,
        reasoning: entry.reasoning || undefined,
        tools: metadata.tools?.length ? metadata.tools : undefined,
        failed: false,
    };
}