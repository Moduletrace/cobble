import type { HarnessToolUse } from "@/src/harness/types";
import claimsWorkUnderWay from "./claims-work-under-way";

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
 * conversation.
 */
const WorkStartingTools = ["start_task", "delegate_task", "ask_crew"];

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

    if (!started && !has_open_work && claimsWorkUnderWay({ text })) {
        problems.push(
            `It says work is under way or that a report will follow, but this reply started no run (start_task) and nothing of yours is open in this conversation. Nothing is running, so no result will come unless you call start_task now.`,
        );
    }

    return problems;
}
