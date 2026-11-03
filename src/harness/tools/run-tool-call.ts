import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import TaskTimeoutError from "@/src/utils/task-timeout-error";
import withTimeout from "@/src/utils/with-timeout";
import HarnessError from "../harness-error";
import unknownToolArgs from "./unknown-tool-args";
import type { HarnessTool, HarnessToolCall, HarnessToolImage } from "../types";

type Params = {
    call: HarnessToolCall;
    tools: HarnessTool[];
    signal: AbortSignal;
};

export type ToolCallResult = {
    /**
     * The tool message's content.
     */
    text: string;
    /**
     * Images the tool returned (at most `AppData.HarnessToolMaxImages`),
     * marked `from_tool`, for the turn after the tool results.
     */
    images: HarnessToolImage[];
};

/**
 * Runs one tool call and returns what the model gets back. Unknown tools,
 * bad arguments and tool failures come back as `Error: ...` so the model
 * can correct itself; only cancellation is thrown.
 */
export default async function runToolCall({ call, tools, signal }: Params): Promise<ToolCallResult> {
    const text = await runTool({ call, tools, signal });

    if (typeof text == "string") return { text, images: [] };

    return {
        text: truncate({ text: text.text }),
        images: text.images
            .slice(0, AppData.HarnessToolMaxImages)
            .map((image) => ({ ...image, from_tool: true })),
    };
}

async function runTool({ call, tools, signal }: Params) {
    const tool = tools.find((t) => t.name == call.name);

    if (!tool) {
        return `Error: There is no tool called "${call.name}". Available: ${tools.map((t) => t.name).join(", ") || "none"}.`;
    }

    let raw: unknown;

    try {
        raw = call.arguments.trim() ? JSON.parse(call.arguments) : {};
    } catch {
        return `Error: The arguments for ${call.name} weren't valid JSON. Send a JSON object.`;
    }

    if (!raw || typeof raw != "object" || Array.isArray(raw)) {
        return `Error: The arguments for ${call.name} must be a JSON object.`;
    }

    const { unknown, known } = unknownToolArgs({ schema: tool.schema, args: raw as Record<string, unknown> });

    if (unknown.length) {
        return `Error: ${call.name} doesn't take ${unknown.join(", ")}. Its arguments are: ${known.join(", ") || "none"}. Nothing was done; call it again with those names.`;
    }

    const parsed = tool.schema?.safeParse(raw);

    if (parsed && !parsed.success) {
        return `Error: Wrong arguments for ${call.name}.\n${z.prettifyError(parsed.error)}`;
    }

    try {
        const output = await withTimeout({
            timeout_ms: AppData.HarnessToolTimeoutMs,
            signal,
            message: `${call.name} took too long and was stopped.`,
            task: (tool_signal) =>
                tool.run({
                    args: parsed ? parsed.data : raw,
                    signal: tool_signal,
                }),
        });

        return typeof output == "string" ? truncate({ text: output }) : output;
    } catch (error: unknown) {
        if (signal.aborted) {
            throw new HarnessError({ message: `Cancelled.`, code: "aborted" });
        }

        if (error instanceof TaskTimeoutError) {
            return `Error: ${error.message}`;
        }

        return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
}

function truncate({ text }: { text: string }) {
    const max = AppData.HarnessToolResultMaxChars;

    if (text.length <= max) return text;

    return `${text.slice(0, max)}\n[Cut: ${text.length - max} more characters.]`;
}
