import { z } from "zod";
import { AppData } from "@/src/data/app-data";
import isBrowserTool from "@/src/utils/browser-tool-name";
import TaskTimeoutError from "@/src/utils/task-timeout-error";
import withTimeout from "@/src/utils/with-timeout";
import HarnessError from "../harness-error";
import browserRecoveryHint from "./computer/browser-recovery-hint";
import unknownToolArgs from "./unknown-tool-args";
import unknownToolMessage from "./unknown-tool-message";
import toolTimeoutMs from "./tool-timeout-ms";
import type { HarnessTool, HarnessToolCall, HarnessToolImage } from "../types";

/**
 * Share of a cut result given to its start; the rest keeps its end.
 */
const TruncateHeadShare = 0.5;

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
    /**
     * How long the call took, for the debug view's trace.
     */
    duration_ms: number;
    /**
     * Whether the tool actually did its work. The loop reads this rather
     * than guessing from an `Error:` prefix in the text: a tool's own
     * answer can start with those words, and a failure must count as one
     * even when its text doesn't (L1).
     */
    ok: boolean;
};

/**
 * Runs one tool call and returns what the model gets back. Unknown tools,
 * bad arguments and tool failures come back as `Error: ...` so the model
 * can correct itself; only cancellation is thrown.
 */
export default async function runToolCall({ call, tools, signal }: Params): Promise<ToolCallResult> {
    const started_at = Date.now();
    const result = await runTool({ call, tools, signal });
    const duration_ms = Date.now() - started_at;

    return {
        text: result.text,
        images: result.images
            .slice(0, AppData.HarnessToolMaxImages)
            .map((image) => ({ ...image, from_tool: true })),
        duration_ms,
        ok: result.ok,
    };
}

/**
 * What one tool call produced: its text, any images, and whether it
 * worked. Every path returns this shape so the loop never has to infer
 * success from the text's first words.
 */
type ToolOutput = { text: string; images: HarnessToolImage[]; ok: boolean };

async function runTool({ call, tools, signal }: Params): Promise<ToolOutput> {
    const tool = tools.find((t) => t.name == call.name);

    if (!tool) {
        return { text: unknownToolMessage({ name: call.name, tools }), images: [], ok: false };
    }

    let raw: unknown;

    try {
        raw = call.arguments.trim() ? JSON.parse(call.arguments) : {};
    } catch {
        return { text: `Error: The arguments for ${call.name} weren't valid JSON. Send a JSON object.`, images: [], ok: false };
    }

    if (!raw || typeof raw != "object" || Array.isArray(raw)) {
        return { text: `Error: The arguments for ${call.name} must be a JSON object.`, images: [], ok: false };
    }

    const { unknown, known } = unknownToolArgs({ schema: tool.schema, args: raw as Record<string, unknown> });

    if (unknown.length) {
        return { text: `Error: ${call.name} doesn't take ${unknown.join(", ")}. Its arguments are: ${known.join(", ") || "none"}. Nothing was done; call it again with those names.`, images: [], ok: false };
    }

    const parsed = tool.schema?.safeParse(raw);

    if (parsed && !parsed.success) {
        return { text: `Error: Wrong arguments for ${call.name}.\n${z.prettifyError(parsed.error)}`, images: [], ok: false };
    }

    try {
        const args = parsed ? parsed.data : raw;
        const timeout_ms = toolTimeoutMs({ tool });

        /**
         * A tool with no deadline (`computer_bash`) runs until it ends, the
         * run is stopped or its job ends: the caller's signal alone cancels
         * it, so a long command isn't cut at a tool's own limit.
         */
        const output = timeout_ms == null
            ? await tool.run({ args, signal })
            : await withTimeout({
                  timeout_ms,
                  signal,
                  message: `${call.name} took too long and was stopped.`,
                  task: (tool_signal) => tool.run({ args, signal: tool_signal }),
              });

        if (typeof output == "string") {
            return { text: truncate({ text: output, name: call.name }), images: [], ok: true };
        }

        return { text: truncate({ text: output.text, name: call.name }), images: output.images || [], ok: true };
    } catch (error: unknown) {
        if (signal.aborted) {
            throw new HarnessError({ message: `Cancelled.`, code: "aborted" });
        }

        if (error instanceof TaskTimeoutError) {
            return { text: withBrowserHint({ name: call.name, text: `Error: ${error.message}` }), images: [], ok: false };
        }

        return {
            text: withBrowserHint({
                name: call.name,
                text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            }),
            images: [],
            ok: false,
        };
    }
}

/**
 * A failed browser call with what its error doesn't say (`browserRecoveryHint`):
 * an element that never settled, or a bridge that is down and belongs to the
 * computer. Every other tool, and every other failure, is left as it is.
 */
function withBrowserHint({ name, text }: { name: string; text: string }) {
    const hint = browserRecoveryHint({ name, text });

    return hint ? `${text}\n\n${hint}` : text;
}

/**
 * A result past its tool's cap is cut there, keeping its start and its
 * end: a command's answer and the totals or error it ends with are the
 * parts worth reading, and a head-only cut once threw away the end of
 * every long `du`/`find` sweep, so runs re-ran the command to see it. The
 * note between them says what was left out. Browser tools get the smaller
 * cap: a page snapshot or an evaluate over a whole page was the heaviest
 * thing a run kept resending.
 */
function truncate({ text, name }: { text: string; name: string }) {
    const browser = isBrowserTool({ name });
    const max = browser ? AppData.HarnessBrowserResultMaxChars : AppData.HarnessToolResultMaxChars;

    if (text.length <= max) return text;

    const hint = browser ? " Narrow the call (a selector, an element ref, a smaller evaluate) to see the rest." : "";
    const note_for = (left_out: number) => `\n\n[... ${left_out} characters left out. ...]${hint}\n\n`;
    /**
     * The note reports what was actually cut (the text minus the two ends
     * kept), and its own length fills part of the cap, so the count and the
     * room settle together: a count of `text.length - max` was short by the
     * note's length (L5). Sized so the whole result stays inside the cap.
     */
    let left_out = text.length - max;
    let note = note_for(left_out);
    let room = Math.max(0, max - note.length);

    for (let i = 0; i < 4 && room > 0; i++) {
        const next_left = text.length - room;
        const next_note = note_for(next_left);
        const next_room = Math.max(0, max - next_note.length);

        if (next_left === left_out && next_room === room) break;

        left_out = next_left;
        note = next_note;
        room = next_room;
    }

    /**
     * When the cap is smaller than the note itself there is no room for
     * any of the text: return the note alone. `text.slice(-0)` would be
     * the WHOLE text, the opposite of a cut (L7).
     */
    if (room === 0) return note_for(text.length);

    const head = Math.floor(room * TruncateHeadShare);
    const tail = room - head;

    return `${text.slice(0, head)}${note}${text.slice(-tail)}`;
}
