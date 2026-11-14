import { AppData } from "@/src/data/app-data";
import capTraceText from "./cap-trace-text";
import toolArgumentPath from "./tool-argument-path";
import type { HarnessTrace } from "./types";

/**
 * A trace as `bot_job_traces` stores it: whole fields the debug view reads
 * straight, with only the numbers and names it shows beside them in
 * `metadata`.
 */
export type PreparedTrace = {
    kind: HarnessTrace["kind"];
    name: string | null;
    text: string | null;
    reasoning: string | null;
    arguments: string | null;
    result: string | null;
    metadata: string | null;
};

/**
 * One trace, its text cut to the caps the debug view keeps
 * (`AppData.BotTraceTextMaxChars`, `BotTraceArgumentsMaxChars`,
 * `BotTraceResultMaxChars`). A turn's tool calls keep their names only:
 * the tool rows of the same step carry the arguments.
 */
export default function prepareTrace({ trace }: { trace: HarnessTrace }): PreparedTrace {
    if (trace.kind == "turn") {
        return {
            kind: "turn",
            name: null,
            text: capTraceText({ text: trace.text, max: AppData.BotTraceTextMaxChars }),
            reasoning: capTraceText({ text: trace.reasoning, max: AppData.BotTraceTextMaxChars }),
            arguments: null,
            result: null,
            metadata: JSON.stringify({
                index: trace.index,
                model: trace.model,
                provider: trace.provider,
                finish_reason: trace.finish_reason,
                duration_ms: trace.duration_ms,
                tools: trace.tool_calls.map((call) => call.name),
                usage: trace.usage || null,
            }),
        };
    }

    if (trace.kind == "tool") {
        return {
            kind: "tool",
            name: trace.name,
            text: null,
            reasoning: null,
            arguments: capTraceText({
                text: trace.arguments,
                max: AppData.BotTraceArgumentsMaxChars,
                keep: toolArgumentPath({ text: trace.arguments }),
            }),
            result: capTraceText({ text: trace.result, max: AppData.BotTraceResultMaxChars }),
            metadata: JSON.stringify({
                index: trace.index,
                ok: trace.ok,
                images: trace.images,
                duration_ms: trace.duration_ms,
                repeat_of: trace.repeat_of ?? null,
            }),
        };
    }

    return {
        kind: "event",
        name: trace.name,
        text: capTraceText({ text: trace.text, max: AppData.BotTraceTextMaxChars }),
        reasoning: null,
        arguments: null,
        result: null,
        metadata: JSON.stringify({ index: trace.index }),
    };
}