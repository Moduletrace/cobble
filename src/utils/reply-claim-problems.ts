import type { HarnessToolUse } from "@/src/harness/types";
import claimsWorkUnderWay from "./claims-work-under-way";
import unsupportedAppRecordLines from "./app-record-claims";

type Params = {
    text: string;
    /**
     * Every tool call the reply made so far.
     */
    tool_uses: HarnessToolUse[];
    /**
     * `[file:ID]` refs in the text that name no file the user can open.
     */
    missing_file_ids?: number[];
    /**
     * `[task:ID]` refs in the text that name no task the user can open.
     */
    missing_task_ids?: number[];
    /**
     * `[setting:section:field]` refs in the text that name no setting the
     * app has (`unresolvedSettingRefs`).
     */
    unresolved_setting_refs?: string[];
    /**
     * A run of the bot's, a job it handed over or a room it asked, still
     * open from this conversation: its result is still to come.
     */
    has_open_work?: boolean;
};

/**
 * The tools whose work goes on after the reply and comes back to the
 * conversation. Every name here must be one the harness registers:
 * `ask_crew` outlived the rename to `ask_bot` here, so a reply that really
 * had asked the crew was still faulted for saying it was working.
 */
export const WorkStartingTools = ["start_task", "delegate_task", "ask_bot"];

/**
 * What in a reply's answer the app's record contradicts: refs to files or
 * tasks that don't exist, and work said to be under way or a report
 * promised when nothing was started and nothing is open. Empty when the
 * answer holds up. Bots wrote "I'm scanning the contests now" and the
 * scan's results in one answer, with no tool called and a made-up file.
 */
export default function replyClaimProblems({
    text,
    tool_uses,
    missing_file_ids = [],
    missing_task_ids = [],
    unresolved_setting_refs = [],
    has_open_work,
}: Params): string[] {
    const problems: string[] = [];

    if (missing_file_ids.length) {
        problems.push(
            `It names ${missing_file_ids.map((id) => `[file:${id}]`).join(", ")}, but no such file exists. A file exists only once write_file, make_pdf, generate_image, generate_video or import_file saved it; list_files shows what's there.`,
        );
    }

    if (missing_task_ids.length) {
        problems.push(
            `It names ${missing_task_ids.map((id) => `[task:${id}]`).join(", ")}, which ${missing_task_ids.length == 1 ? "is" : "are"} no task the user can open (never created, or deleted). list_tasks shows what's there.`,
        );
    }

    if (unresolved_setting_refs.length) {
        problems.push(
            `It points at ${unresolved_setting_refs.join(", ")}, which ${unresolved_setting_refs.length == 1 ? "is" : "are"} no setting the app has, so the pill would go nowhere. read_settings lists every setting with the ref to write.`,
        );
    }

    const started = tool_uses.some((use) => use.ok && WorkStartingTools.includes(use.name));

    /**
     * A record line the answer wrote itself that claims work this reply
     * never did. Only these are the app's word to the user, so only these
     * are faulted: a mention of the line inside a sentence is the bot
     * naming what it got wrong, and a line the record supports is the
     * app's truth copied over (`unsupportedAppRecordLines`). Run #468
     * faulted the correction three times running for the quoted phrase
     * alone, so the fabrication went out and the apology never did.
     */
    const forged = unsupportedAppRecordLines({ text, tool_uses });

    if (forged.length) {
        problems.push(
            `It writes an app record line of its own, the note the app adds after a past message of yours naming the tools its run called, and it names tools this reply never called. Only the app writes that line, from the tools it recorded; the user reads it as the app's word. Take every line of that shape out of the answer and say only what the tools returned.`,
        );
    }

    if (!started && !has_open_work && claimsWorkUnderWay({ text })) {
        problems.push(
            `It says work is going on beyond this reply, or that its findings are still to come, but this reply started no run (start_task) and nothing of yours is open in this conversation. Nothing is running, so no result arrives unless you call start_task now.`,
        );
    }

    return problems;
}
