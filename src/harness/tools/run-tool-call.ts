import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import HarnessError from "../harness-error";
import type { HarnessTool, HarnessToolCall } from "../types";

type Params = {
    call: HarnessToolCall;
    tools: HarnessTool[];
    signal: AbortSignal;
};

/**
 * Runs one tool call and returns the text the model gets back. Unknown
 * tools, bad arguments and tool failures come back as `Error: ...` so the
 * model can correct itself; only cancellation is thrown.
 */
export default async function runToolCall({ call, tools, signal }: Params) {
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

    const parsed = tool.schema?.safeParse(raw);

    if (parsed && !parsed.success) {
        return `Error: Wrong arguments for ${call.name}.\n${z.prettifyError(parsed.error)}`;
    }

    try {
        return truncate({
            text: await tool.run({ args: parsed ? parsed.data : raw, signal }),
        });
    } catch (error: unknown) {
        if (signal.aborted) {
            throw new HarnessError({ message: `Cancelled.`, code: "aborted" });
        }

        return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
}

function truncate({ text }: { text: string }) {
    const max = AppData.HarnessToolResultMaxChars;

    if (text.length <= max) return text;

    return `${text.slice(0, max)}\n[Cut: ${text.length - max} more characters.]`;
}
