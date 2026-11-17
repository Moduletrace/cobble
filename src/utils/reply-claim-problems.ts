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
     * `[graphic:ID]` refs in the text that name no graphic the user can
     * open: the model writes these itself (`create_graphic` tells it to),
     * so only a dead one is a fault.
     */
    missing_graphic_ids?: number[];
    /**
     * Refs of the cards the app adds under the message itself
     * (`AppCardRefTools`), written in the answer by the model: the app
     * writes every one of these from the tool that made the card, so a
     * hand-written one is made up or copied from an earlier message.
     */
    written_card_refs?: string[];
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
 * The cards the app puts under a message itself: the tool that makes each
 * one and what the user reads there. The model is never told to write these
 * refs, since `withTakeOverRefs` adds the real one from the tool's own
 * record, so one in its answer is made up or copied: the coordinator wrote
 * `[suggestion:11]` after the last real one was `[suggestion:10]`, and the
 * user got buttons reading "not available". Every name here must be one the
 * harness registers (`tool-name-lists.test.ts`).
 */
export const AppCardRefTools = {
    suggestion: { tool: "suggest_next_steps", card: "next steps" },
    question: { tool: "ask_user", card: "questions" },
    plan: { tool: "create_plan", card: "plan" },
} as const;

export type AppCardRefKind = keyof typeof AppCardRefTools;

export const AppCardRefToolNames = Object.values(AppCardRefTools).map(({ tool }) => tool);

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
    missing_graphic_ids = [],
    written_card_refs = [],
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

    if (missing_graphic_ids.length) {
        problems.push(
            `It names ${missing_graphic_ids.map((id) => `[graphic:${id}]`).join(", ")}, but no such graphic exists for the user. create_graphic returns the ref to write; list_graphics shows what's there.`,
        );
    }

    /**
     * A card ref the model wrote itself: the app adds every one of these
     * from the tool that made the card, so a written one is a card that was
     * never made (the user reads "not available") or a copy of an earlier
     * message's. Faulting it is something the bot can stop doing: take the
     * ref out, and call the tool if it wants the card there.
     */
    for (const [kind, { tool, card }] of Object.entries(AppCardRefTools)) {
        const refs = written_card_refs.filter((ref) => ref.toLowerCase().startsWith(`[${kind}:`));

        if (!refs.length) continue;

        problems.push(
            `It writes ${refs.join(", ")} itself, but only the app writes that ref: ${tool} makes the ${card} and the app puts its ref under your message. A ref written by hand names a card that was never made, which the user reads as "not available", or copies one from an earlier message. Take the ref out of the answer; call ${tool} if the ${card} should be there, and say in words what you mean.`,
        );
    }

    const started = tool_uses.some((use) => use.ok && WorkStartingTools.includes(use.name));
    /**
     * A run that reached for `start_task` and was refused was not making the
     * claim up: it is reporting what the app told it. Faulting that note sent
     * an honest "I couldn't start it" back as a lie.
     */
    const tried = tool_uses.some((use) => WorkStartingTools.includes(use.name));

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

    if (!started && !tried && !has_open_work && claimsWorkUnderWay({ text })) {
        problems.push(
            `It says work is going on beyond this reply, or that its findings are still to come, but this reply started no run (start_task) and nothing of yours is open in this conversation. Nothing is running, so no result arrives unless you call start_task now.`,
        );
    }

    return problems;
}
