import type { HarnessToolUse } from "@/src/harness/types";
import type { ReplyStatus } from "@/src/dict/reply-status-dict";
import claimsWorkUnderWay from "./claims-work-under-way";
import unsupportedAppRecordLines from "./app-record-claims";
import replyAppStateClaims, { AppStateTools } from "./reply-app-state-claims";
import proseChoiceQuestion from "./prose-choice-question";
import planModeFileEscape from "./plan-mode-file-escape";

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
     * `[task:ID]` refs in the text that name no task row.
     */
    missing_task_ids?: number[];
    /**
     * Task ids the answer names in plain prose (`task #16`) that name no
     * task row. A row the user cannot open is not missing.
     */
    missing_mentioned_task_ids?: number[];
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
     * `[proposal:ID]` / `[hook-proposal:ID]` refs in the text that name no
     * proposal the user was ever made: the model guessed the next id and
     * described a card nobody got ("I didn't get the proposal", four times
     * in one conversation).
     */
    missing_proposal_ids?: number[];
    missing_hook_proposal_ids?: number[];
    /**
     * A run of the bot's, a job it handed over or a room it asked, still
     * open from this conversation: its result is still to come.
     */
    has_open_work?: boolean;
    /**
     * What the reply declared with `send_reply`. `done` and `blocked` mean
     * nothing is running after the message, so a work claim contradicts
     * them even when an older run is still open. `working` is only honest
     * with a run behind it.
     */
    status?: ReplyStatus;
    /**
     * The reply is running with Plan mode on: every tool that writes is
     * gated, so a file can't be saved until the user leaves the mode (Tab)
     * or approves a plan. Answering an `ask_user` card does not leave it.
     */
    plan_mode?: boolean;
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
    missing_mentioned_task_ids = [],
    unresolved_setting_refs = [],
    missing_graphic_ids = [],
    written_card_refs = [],
    missing_proposal_ids = [],
    missing_hook_proposal_ids = [],
    has_open_work,
    status,
    plan_mode,
}: Params): string[] {
    const problems: string[] = [];

    if (missing_file_ids.length) {
        problems.push(
            `It names ${missing_file_ids.map((id) => `[file:${id}]`).join(", ")}, but no such file exists. A file exists only once write_file, make_pdf, generate_image, generate_video or import_file saved it; list_files shows what's there.`,
        );
    }

    if (missing_task_ids.length) {
        problems.push(
            `It names ${missing_task_ids.map((id) => `[task:${id}]`).join(", ")}, and no such task exists (it was deleted, or never was). list_tasks shows what's there.`,
        );
    }

    if (missing_mentioned_task_ids.length) {
        problems.push(
            `It names ${missing_mentioned_task_ids.map((id) => `task #${id}`).join(", ")}, and no such task exists (it was deleted, or never was). list_tasks shows what's there; a task that is gone is said to be gone, not described as open or waiting.`,
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
     * A proposal ref that names nothing the user was made: a guessed number.
     * The card only exists once the tool that proposes returned it, so a
     * ref written beside the answer describes one nobody got.
     */
    if (missing_proposal_ids.length || missing_hook_proposal_ids.length) {
        const refs = [
            ...missing_proposal_ids.map((id) => `[proposal:${id}]`),
            ...missing_hook_proposal_ids.map((id) => `[hook-proposal:${id}]`),
        ];

        problems.push(
            `It names ${refs.join(", ")}, and no such proposal was ever made to the user. A proposal exists only once the tool that proposes one returned its ref (propose_skill, propose_browser, propose_hook and the like); the app puts that ref under your message itself, so never write one or guess the next number. Call the tool again if the proposal should be made now.`,
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

    /**
     * A choice asked in the text instead of on an `ask_user` card: the user
     * would have to retype an option. Both runs in session 133 sent a
     * numbered choice under "What would you like to do?" and "Which would
     * you like?" with no card, so the ask was a paragraph, not a click.
     * Free-form details the card can't collect stay in the message; the
     * choice itself belongs on the card.
     */
    const prose_choice = proseChoiceQuestion({ text });

    if (prose_choice && !tool_uses.some((use) => use.name == "ask_user" && use.ok)) {
        problems.push(
            `It asks the user to choose in the text ("${prose_choice.question}") with ${prose_choice.options} options. A choice written as a list makes them retype an option; ask_user puts the same question on a card they answer in a click, with your suggestion first. Call ask_user in the same turn as send_reply with those options, keep only free-form details the card can't hold (names, addresses, a table) in the message, and don't repeat the options in the text.`,
        );
    }

    /**
     * A document handed over in Plan mode with the write given back to the
     * user: a made-up missing tool, or an instruction to save it themselves.
     * The tool exists and the mode is what stops it, so the answer asked the
     * wrong thing; 969 pasted the whole roadmap this way.
     */
    const file_escape = plan_mode ? planModeFileEscape({ text }) : null;

    if (file_escape) {
        problems.push(
            `It is Plan mode, and the answer ${file_escape == "missing_tool" ? "says there is no write tool" : "asks the user to save the document themselves"}. write_file exists and Plan mode is the only thing stopping it. Don't paste the document and don't call the tool missing: say in one sentence that Plan mode stops the save, and either write it as a plan they can approve (its steps save it) or say what you will do once they turn Plan mode off (the button under the answer, or Tab). Answering a question does not end Plan mode. A short template the user asked to read can stay in the message.`,
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

    const claim = claimsWorkUnderWay({ text });

    if (claim && (status === "done" || status === "blocked")) {
        problems.push(
            `It ends with status "${status}", which means nothing runs after this message, but it says work is going on beyond this reply or that its findings are still to come. If a run is carrying the work on, end with status "working" and pass work or name the open run; otherwise write the message as finished work and say only what the tools returned.`,
        );
    } else if (claim && status === "working" && !has_open_work) {
        problems.push(
            `It ends with status "working", but nothing of yours is open in this conversation. Pass work to send_reply to queue it now, or end with status "done" and write the answer.`,
        );
    } else if (claim && status == null && !started && !tried && !has_open_work) {
        problems.push(
            `It says work is going on beyond this reply, or that its findings are still to come, but this reply started no run (start_task) and nothing of yours is open in this conversation. Nothing is running, so no result arrives unless you call send_reply with status "working" and work now.`,
        );
    }

    /**
     * The app's own state, described from nothing: which model or provider a
     * call was routed to, a run killed or stopped, the rest called unlimited.
     * A reply that read the app first may be repeating it; one that didn't is
     * making the mechanism up, and the user reads it as the app's word.
     */
    const read_app = tool_uses.some((use) => use.ok && AppStateTools.includes(use.name));

    if (!read_app) {
        const claims = replyAppStateClaims({ text });

        if (claims.includes("routing")) {
            problems.push(
                `It says how the app picks or routes the model, which nothing this reply read told it: the pick is the app's setting, the tool that failed returned only an error, and the user reads the explanation as the app's word. Take the mechanism out and repeat the error the tool gave, in its own words.`,
            );
        }

        if (claims.includes("stopped_run")) {
            problems.push(
                `It says it killed or stopped a run, but a run can't stop itself: Stop in the thread is the user's button. Take the claim out, say what the tool returned, and say the user can Stop the run from the thread.`,
            );
        }

        if (claims.includes("rest")) {
            problems.push(
                `It describes the model rest as unlimited or as needing a restart, which the app never said. Say only what the tool returned, including how long it said the next try waits.`,
            );
        }
    }

    return problems;
}
