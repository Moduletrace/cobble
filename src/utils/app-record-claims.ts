import type { HarnessToolUse } from "@/src/harness/types";
import { AppRecordPrefix, appRecordLines } from "./strip-app-records";

type Params = {
    text: string;
    /**
     * Every tool call the reply made, the app's own record of the run.
     */
    tool_uses: HarnessToolUse[];
};

/**
 * How the app words its record, the one shape it ever writes: `this
 * message's run called update_memory, fetch_url x3 (1 failed).` A line in
 * another shape may still be a forged record wearing other words, so it
 * stays suspect rather than passing.
 */
const RecordShape = /^this message's run called\s+([^.\]]*)/i;

/**
 * Words that sit where a tool name does but name no work: the app's own
 * line for a run that called nothing.
 */
const NotToolNames = ["none", "nothing", "no tools"];

/**
 * The tool names a record line claims the run called, or null when the
 * line isn't in the app's shape. Counts and failure notes (`x3`,
 * `(1 failed)`) come off, and so does anything that isn't a tool name.
 */
function claimedToolNames({ line }: { line: string }): string[] | null {
    /**
     * The app writes one space after the prefix, so it comes off before
     * the shape is read.
     */
    const body = line.trim().slice(AppRecordPrefix.length).trim().replace(/\]\s*$/, "");
    const shape = body.match(RecordShape);

    if (!shape) return null;

    const named = shape[1] ?? "";

    return named
        .split(",")
        .map((part) => part.replace(/\([^)]*\)/g, "").replace(/\s*x\d+/gi, "").trim())
        .filter((name) => /^[a-z][a-z0-9_]*$/.test(name))
        .filter((name) => !NotToolNames.includes(name.toLowerCase()));
}

/**
 * The record lines in a bot's answer the app's record of the reply does not
 * support: each names a tool this reply never called. This is the only
 * forgery that hurts, since it makes the app vouch for work no tool did.
 *
 * A line the record supports is the app's truth in the app's shape: copied
 * out of the bot's own history, usually to say plainly that it wrote the
 * line before it had called the tool. Saying that is the correction the
 * user needs, so it is left alone. `run-bot-reply` strips these lines from
 * what it stores anyway, so the user never reads the copy as the app's
 * word.
 */
export default function unsupportedAppRecordLines({ text, tool_uses }: Params): string[] {
    const recordLines = appRecordLines({ text });

    if (!recordLines.length) return [];

    /**
     * A failed call was still a call: the app's own line names it, with
     * the count of what went wrong.
     */
    const called = new Set(tool_uses.map((use) => use.name));

    return recordLines.filter((line) => {
        const claims = claimedToolNames({ line });

        if (!claims) return true;

        return claims.some((name) => !called.has(name));
    });
}
