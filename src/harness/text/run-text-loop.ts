import { AppData } from "@/src/data/app-data";
import {
    alreadyRanToolNote,
    answerNotSentNote,
    closingFailedNote,
    closingMixedNote,
    closingNoTextNote,
    commitEarlyNote,
    contextTrimmedNote,
    failedToolCallNote,
    oversizedRequestNote,
    repairedAnswerNote,
    repeatedAnswerNote,
    replyClosingFailedNote,
    replyClosingMixedNote,
    replyClosingRequiredNote,
    replyDraftNote,
    replyNoTextNote,
    tokensLowNote,
} from "@/src/data/harness-prompts";
import { isUnlimitedLimit, type RunLimit, UnlimitedLimit } from "@/src/utils/run-limit";
import sanitizeAnswerText from "@/src/utils/sanitize-answer-text";
import repairAnswerText from "@/src/utils/repair-answer-text";
import { logError } from "@/src/functions/backend/logger";
import type { ReplyStatus } from "@/src/dict/reply-status-dict";
import { ReplyStatuses } from "@/src/dict/reply-status-dict";
import HarnessError from "../harness-error";
import isClosingTool, { SendReplyToolName } from "../tools/closing-tool-names";
import resolveHarnessCandidates from "../resolve/resolve-harness-candidates";
import loadToolsTool from "../tools/load-tools-tool";
import repeatToolCallKey, { toolCallKey } from "../tools/repeat-tool-call-key";
import isRepeatableTool from "../tools/repeatable-tool-names";
import runToolCall from "../tools/run-tool-call";
import type { ToolCallResult } from "../tools/run-tool-call";
import toolDefinition from "../tools/tool-definition";
import isWritingTool from "../tools/writing-tool-names";
import type { HarnessTrace, HarnessTracer } from "../trace/types";
import type {
    HarnessCandidate,
    HarnessMessage,
    HarnessTool,
    HarnessToolCall,
    HarnessToolImage,
    HarnessToolUse,
    HarnessUsage,
} from "../types";
import deferredToolsNote from "./deferred-tools-note";
import describeToolUses from "./describe-tool-uses";
import dropOldToolImages from "./drop-old-tool-images";
import fitTranscriptToContext from "./fit-transcript-to-context";
import generateText from "./generate-text";
import pushUserTurn from "./push-user-turn";
import supersedeToolOutputs from "./supersede-tool-outputs";
import toolImagesTurn from "./tool-images-turn";

export type TextLoopStep = {
    index: number;
    text: string | null;
    tool_calls: HarnessToolCall[];
    candidate: HarnessCandidate;
};

type Params = {
    /**
     * The bot's full prompt (`grabBotPrompt`).
     */
    system: string;
    /**
     * The conversation so far, ending with what to do now.
     */
    messages: HarnessMessage[];
    /**
     * The run's tools. Deferred ones (`HarnessTool.deferred`) are listed
     * by name and loaded with `load_tools`, when together they're large
     * enough to be worth it (`AppData.HarnessDeferToolsMinChars`).
     */
    tools?: HarnessTool[];
    max_steps?: RunLimit;
    /**
     * Prompt tokens the run may spend in all (`grabRunMaxPromptTokens`):
     * once its turns have sent this many, the next one is the wrap up.
     * Unlimited or left out, only the run's other bounds end it.
     */
    max_prompt_tokens?: RunLimit;
    /**
     * The working context (`grabContextBudgetTokens`): the most each turn
     * sends before old tool output is trimmed, whatever the model's
     * window. Unlimited or left out, the window decides.
     */
    context_budget?: RunLimit;
    signal?: AbortSignal;
    /**
     * The model a plan turn already used (`planBotTask`). Tried first among
     * the automatic picks, so the run works the plan on the model that
     * wrote it when that model is still the one to use.
     */
    prefer_key?: string;
    /**
     * Called after each model turn, before its tools run. Use it for
     * progress and checkpoints.
     */
    onStep?: (step: TextLoopStep) => Promise<void> | void;
    /**
     * Where the run's detailed trace goes (`bot_job_traces`, the
     * conversation's debug view): every turn with what the model reasoned,
     * every tool call with its arguments and answer, and what the loop
     * itself did. Best effort: a trace that can't be kept never fails the
     * run.
     */
    trace?: HarnessTracer;
    /**
     * The user's turns that arrived since the run started (and since the
     * last call), read after each round of tools and before an answer is
     * returned. They join the transcript, so a message sent while the bot
     * works can change what it does, and an answer they arrive in time for
     * is written again with them in mind. `counted` is false at the wrap up:
     * those turns are read, not answered (`takeIncoming`).
     */
    incoming?: (params?: { counted?: boolean }) => Promise<HarnessMessage[]>;
    /**
     * What the run is told with what came in: `working` after a round of
     * tools, `redraft` past an answer that hadn't gone out (defaults
     * `IncomingMessagesNote`, `RedraftNote`). With `wrap_up`, what came in
     * by the wrap up is added before it too, for a run nothing picks up
     * after (a task); without it a later reply does.
     */
    incoming_notes?: { working?: string; redraft?: string; wrap_up?: string };
    /**
     * What the app itself can say about the run's work at the wrap up, read
     * from the machine rather than from the run's memory: the state of the
     * folders it worked in (`worktreeSummary`). Called once, before the wrap
     * up turn, and nothing is added when it returns empty. Only a task run
     * passes one: a reply has no folders of its own.
     */
    wrap_up_note?: () => Promise<string> | string;
    /**
     * Checks an answer before it's returned, with the tool calls the run
     * made. A note sends the answer back to be written again with it, up to
     * `AppData.HarnessReviewRewrites` times; null lets it through. Past that
     * the answer is never sent and the run returns its note (`review_note`).
     * A rewrite is checked again even when it lands on the wrap up: that
     * turn exists only because the previous answer was sent back. A check
     * that throws lets the answer through.
     */
    review?: (params: {
        text: string;
        tool_uses: HarnessToolUse[];
        status?: ReplyStatus;
    }) => Promise<string | null | undefined>;
    /**
     * The run must end with `send_reply`: the text a turn writes without it
     * is a draft and is never sent. A reply and a task report both set this,
     * so the app's record of what happens after the message is the call the
     * model made, never a promise the app read out of prose.
     */
    require_closing_answer?: boolean;
    /**
     * The bot the run is for: its own models are used where it has them.
     */
    bot_id?: number | string;
    /**
     * The workspace the call is in: its models apply to the bots with none of their own.
     */
    workspace_id?: number | string | null;
    generate?: typeof generateText;
    resolveCandidates?: () => Promise<HarnessCandidate[]>;
};

export type TextLoopResult = {
    /**
     * The final answer for the user.
     */
    text: string;
    /**
     * Everything after the system prompt, including tool turns.
     */
    messages: HarnessMessage[];
    steps: number;
    candidate: HarnessCandidate;
    usage: HarnessUsage;
    /**
     * Every tool call the run made, in order, and whether it went through.
     */
    tool_uses: HarnessToolUse[];
    /**
     * Why there is no answer: `review` faulted every one the run wrote, up to
     * `AppData.HarnessReviewRewrites`. `text` is empty and must not be shown;
     * the caller fails the job with this instead of delivering an answer the
     * app knows is wrong.
     */
    review_note?: string;
    /**
     * What the closing `send_reply` declared, when the run ended with one.
     * A caller that queued work with it keeps that run only for `working`;
     * anything else was withdrawn by the correction that ended the reply.
     */
    status?: ReplyStatus;
};

/**
 * The wrap-up tools that save the work. A run that spent every step
 * measuring can write the report the user waits for rather than throw its
 * findings away (`write_file`, and `import_file` for what it pulled off a
 * computer).
 */
export const WrapUpSaveToolNames = ["write_file", "import_file"];

/**
 * The wrap-up tool that hands the work on. A chat reply has a step
 * budget (`AppData.BotReplyMaxToolSteps`, unlimited unless the install
 * sets one), and a reply that used it all researching leaves the writing
 * undone; the next reply starts from the same budget, so the run queues
 * the rest as a task while it can still call a tool, rather than saying it
 * will do it later. `send_reply` carries that hand-off as `work`, and is
 * also the only way the run's message goes out.
 */
export const WrapUpHandOffToolNames = ["start_task"];

/**
 * The tool that ends the run's message. A reply and a task report must end
 * with it (`require_closing_answer`), even on the last wrap-up turn, when
 * every other tool is gone: without it there is no message, not a promise
 * the app has to read out of prose.
 */
export const WrapUpAnswerToolNames = [SendReplyToolName];

/**
 * Every tool the wrap up may still call (`WrapUpSaveToolNames`,
 * `WrapUpHandOffToolNames` and `WrapUpAnswerToolNames`): those the run has,
 * in its own order.
 */
export const WrapUpToolNames = [...WrapUpSaveToolNames, ...WrapUpHandOffToolNames, ...WrapUpAnswerToolNames];

/**
 * Saving turns a wrap up may take: the first, and one more when it reached
 * for a tool it no longer has. After them the run answers with no tools.
 */
export const WrapUpSavingTurns = 2;

/**
 * Told on the last step, with the app's record of the tools the run
 * called (`describeToolUses`): out of steps, a model tends to report the
 * work it planned as done. `tokens` when the run's token budget ended it
 * rather than its steps. `saving` and `hand_off` name the tools it may
 * still call, if any: its one last round, after which it answers with
 * none.
 */
export const wrapUpPrompt = ({
    uses,
    reason = "steps",
    saving = [],
    hand_off = [],
    answer = [],
}: {
    uses: HarnessToolUse[];
    reason?: "steps" | "tokens";
    saving?: string[];
    hand_off?: string[];
    answer?: string[];
}) =>
    `${reason == "tokens" ? "This run has used all the tokens it may spend." : "You've used every step this run allows."} ${wrapUpToolsPrompt({
        saving,
        hand_off,
        answer,
    })} Report what you did, what is left, and anything you need from the user.

The tools you actually called this run: ${describeToolUses({ uses })}. Nothing else happened. Don't say you saved, created, changed or sent anything this list doesn't show; what you meant to do and didn't is still left, so say so.`;

/**
 * What the wrap up may still call, said in one line: save the work, hand
 * on what it can't finish, or neither.
 */
const wrapUpToolsPrompt = ({
    saving,
    hand_off,
    answer,
}: {
    saving: string[];
    hand_off: string[];
    answer: string[];
}) => {
    if (!saving.length && !hand_off.length && !answer.length) return `Don't call any more tools.`;

    return [
        saving.length
            ? `You have one turn to save what the user needs: ${saving.join(" and ")} are still yours. Call only what saves the work (the report or deliverable)${hand_off.length || answer.length ? "" : " and nothing else"}, then report.`
            : "",
        hand_off.length
            ? saving.length
                ? `If real work is left that this run can't finish, call ${hand_off.join(" or ")} with a complete brief of what's left: it runs after this turn and posts its own result.`
                : `You have one turn to hand the work on: ${hand_off.join(" or ")} is still yours. If real work is left, call it with a complete brief of what's left: it runs after this turn and posts its own result.`
            : "",
        answer.length
            ? `End the run with ${answer.join(" or ")}: the message you wrote in that turn is what the user gets, and the call says what happens after it. A message without it is a draft and is never sent. Call it on its own turn, after the tools above have run.`
            : "",
        `After this turn no tool is left, so anything unsaved is lost, and so is work you only say you'll do later.`,
    ]
        .filter(Boolean)
        .join(" ");
};

/**
 * The status a `send_reply` call declared, for the review: a call whose
 * arguments don't parse or name an unknown status is left undefined, and
 * the tool's own schema refuses it before this matters.
 */
const replyStatusFromCall = ({ call }: { call: HarnessToolCall }): ReplyStatus | undefined => {
    try {
        const args = JSON.parse(call.arguments || "{}");

        return ReplyStatuses.includes(args?.status) ? (args.status as ReplyStatus) : undefined;
    } catch {
        return undefined;
    }
};

/**
 * Steps left when a run is warned, once, to save: a share of the run for
 * long ones, since 5 steps is the whole budget of a short one and no time
 * at all to write a report on a 200 step run (two runs in a row measured
 * to their last step with the report unwritten). Never below
 * `AppData.HarnessStepsLowWarning`.
 */
export const stepsLowWarningLeft = ({ max_steps }: { max_steps: number }) =>
    Math.max(AppData.HarnessStepsLowWarning, Math.ceil(max_steps * AppData.HarnessStepsLowWarnShare));

/**
 * Told once, `stepsLowWarningLeft` steps before the wrap up, while the run
 * can still save what it has.
 */
export const stepsLowNote = ({ left }: { left: number }) =>
    `You have ${left} step${left == 1 ? "" : "s"} left in this run. Save what the user will want now (the report or deliverable, with write_file or import_file) before anything else, then finish. What isn't saved when the steps run out is lost.`;

/**
 * Told with what the user wrote while the run worked. Whether a message
 * belongs to the work is the model's call, from what it says: a correction
 * changes the work, a separate request is acknowledged (`send_message`,
 * where the run has it) and done after.
 */
export const IncomingMessagesNote = `The user wrote again while you were working (below). Decide what it is from what it means, not how it's worded:
- If it changes, corrects or adds to what you're doing, take it into account and carry on with the updated request.
- If it's a separate request, don't drop what you're doing: if you can send_message, acknowledge it in a line now (say you'll get to it once this is done), then finish the current work, deal with the new request, and cover both in your answer.
- If it only needs a quick answer, give it with send_message if you can and carry on.`;

/**
 * Told when the user wrote past an answer that hadn't gone out yet.
 */
export const RedraftNote = `Your answer above was not sent: the user wrote again before it went out (below). Decide what it is from what it means, not how it's worded:
- If it changes or adds to what you were answering, write the answer again with it in mind.
- If it's separate, keep your answer as it is and deal with the new message too: in the same answer, or send the first with send_message and then answer the new one.
Don't repeat tool calls you have already made.`;

/**
 * The text harness at work: the model answers or calls tools, tool results
 * go back to it, and so on until it answers without calling a tool. Tools
 * run one at a time, in order; images they return follow their results. Stays on one model unless it fails. After
 * `max_steps` turns, or once the run has sent `max_prompt_tokens`, the
 * model is asked to wrap up: one turn with only the wrap-up tools
 * (`WrapUpToolNames`: what saves the work, `start_task` for the rest, and
 * `send_reply` for the message),
 * then one with none. With neither set (unlimited), the run ends when the
 * model answers without calling a tool, or when its job's deadline or its
 * abort signal ends it. An answer `review` finds fault
 * with is written again, a bounded number of times
 * (`AppData.HarnessReviewRewrites`); one it still finds fault with is never
 * sent, and the run returns why instead (`review_note`).
 *
 * Every turn resends everything, so the run keeps it small: only the
 * newest page snapshot of each browser stays (`supersedeToolOutputs`),
 * old tool output is trimmed to the working context
 * (`fitTranscriptToContext`), and deferred tools are listed by name until
 * loaded.
 */
export default async function runTextLoop({
    system,
    messages,
    tools = [],
    max_steps = AppData.HarnessMaxToolSteps,
    max_prompt_tokens,
    context_budget,
    signal = new AbortController().signal,
    prefer_key: planned_key,
    onStep,
    trace,
    incoming,
    incoming_notes,
    wrap_up_note,
    review,
    require_closing_answer = false,
    bot_id,
    workspace_id,
    generate = generateText,
    resolveCandidates = () => resolveHarnessCandidates({ harness: "text", bot_id, workspace_id }),
}: Params): Promise<TextLoopResult> {
    const candidates = await resolveCandidates();
    /**
     * Deferred tools wait to be loaded only when their definitions
     * together are worth keeping out of every turn.
     */
    const deferrable = tools.filter((tool) => tool.deferred);
    const defer =
        deferrable.reduce((sum, tool) => sum + JSON.stringify(toolDefinition({ tool })).length, 0) >=
        AppData.HarnessDeferToolsMinChars;
    /**
     * Loaded deferred tools, in the order they were loaded: their
     * definitions go after the others, so the start of the list (and of
     * the prompt, which providers cache) stays the same.
     */
    const loaded: string[] = [];
    const run_tools: HarnessTool[] = defer
        ? [
              ...tools,
              loadToolsTool({
                  deferred: deferrable,
                  isLoaded: (name) => loaded.includes(name),
                  onLoad: (names) => loaded.push(...names),
              }),
          ]
        : tools;
    const all_definitions = new Map(run_tools.map((tool) => [tool.name, toolDefinition({ tool })]));
    const definitionsNow = () => [
        ...run_tools.filter((tool) => !defer || !tool.deferred).map((tool) => all_definitions.get(tool.name)!),
        ...loaded.map((name) => all_definitions.get(name)!),
    ];
    const run_system = defer ? `${system}\n\n${deferredToolsNote({ tools: deferrable })}` : system;
    const media_cache = new Map<string, string>();
    const transcript: HarnessMessage[] = [...messages];
    const usage: Required<Omit<HarnessUsage, "cached_tokens">> = {
        prompt_tokens: 0,
        completion_tokens: 0,
        cost: 0,
    };
    const tool_uses: HarnessToolUse[] = [];
    /**
     * The reads this run already made, by the call they answer
     * (`repeatToolCallKey`), the step it was and the transcript message its
     * output went into. A read repeated word for word gets this answer
     * instead of being run again, and anything that may have written forgets
     * them: a file read once, then edited, is read again.
     */
    const repeated_reads = new Map<string, { step: number; message: HarnessMessage }>();
    /**
     * The calls that failed, by the call they answer (`toolCallKey`), with
     * the step the first of them ran on and the error it gave. An identical
     * call past `AppData.HarnessSameFailureRetries` is answered from here
     * instead of being run: it fails the same way, and each repeat resends
     * the whole transcript (one run paid five times for the same
     * `FileNotFoundError`). Anything that could change the outcome clears
     * them, so a call retried after the missing piece was put in place runs.
     */
    const failed_calls = new Map<string, { step: number; attempts: number; error: string }>();
    /**
     * The tools a wrap up may still call: what saves the work, and
     * `start_task` for the work it can't finish. A run that spent every
     * step measuring can then still write the report the user is waiting
     * for, which is what two runs in a row failed to do (they measured to
     * the last step and had no tool left to save with), and a reply out of
     * steps hands the rest to a task instead of promising it.
     */
    const wrap_tools = run_tools.filter((tool) => WrapUpToolNames.includes(tool.name));
    const save_tools = wrap_tools.filter((tool) => WrapUpSaveToolNames.includes(tool.name));
    const hand_off_tools = wrap_tools.filter((tool) => WrapUpHandOffToolNames.includes(tool.name));
    const answer_tools = wrap_tools.filter((tool) => WrapUpAnswerToolNames.includes(tool.name));
    const wrap_definitions = wrap_tools.map((tool) => all_definitions.get(tool.name)!);
    const answer_definitions = answer_tools.map((tool) => all_definitions.get(tool.name)!);
    /**
     * What bounds this run, recorded with every call it makes, so a reply
     * can be told later which limit shaped it (`read_message_usage`).
     * `null` only ever means an old record; new runs say `"unlimited"`.
     */
    const call_limits = {
        steps: max_steps,
        run_tokens: max_prompt_tokens ?? UnlimitedLimit,
        context_tokens: context_budget ?? UnlimitedLimit,
    };
    /**
     * A step count to count against, for the loop itself: an unlimited run
     * counts on to the model's own answer (or the job's deadline).
     */
    const step_ceiling = isUnlimitedLimit(max_steps) ? Infinity : max_steps;

    const warn_at = isUnlimitedLimit(max_steps) ? 0 : stepsLowWarningLeft({ max_steps });
    let prefer_key = planned_key;
    /**
     * How many answers the review has sent back, and the last one it faulted,
     * whitespace collapsed, to see a model that wrote the same message back.
     */
    let review_rewrites = 0;
    let faulted_answer: string | null = null;
    /**
     * The previous answer was sent back, so this turn exists to rewrite it.
     * Checked again even on the wrap up: that turn would otherwise return
     * the rewrite unchecked, and a claim the app already faulted would go
     * out. Cleared once the rewrite has been read, so the wrap up is not
     * an open-ended review loop.
     */
    let review_pending = false;
    /**
     * A run that wrote a message and then called a tool has been told, once,
     * that the message never went out (`answerNotSentNote`).
     */
    let told_answer_lost = false;
    /**
     * A card put up with nothing said beside it has been told, once, to write
     * the sentence that goes with it (`closingNoTextNote`).
     */
    let told_closing_text = false;
    /**
     * How many turns the run has spent retrying a closing card: a closing
     * call that failed, or a card put up beside other work. Bounded
     * (`AppData.MaxClosingRetries`) so a model that keeps re-asking into the
     * once-per-run guard ends the run instead of looping on the same note.
     */
    let closing_retries = 0;
    /**
     * How many text-only turns were drafts a required `send_reply` never
     * ended. Bounded (`AppData.HarnessReplyDraftsMax`): past it the run
     * fails rather than sending prose the app can't vouch for.
     */
    let reply_drafts = 0;
    /**
     * A run whose prompt no longer fits the working context, with nothing
     * trimmable left, has been told, once (`oversizedRequestNote`).
     */
    let told_over_budget = false;
    /**
     * How many turns the app trimmed earlier tool output for
     * (`fitTranscriptToContext`), so the run can be told
     * (`contextTrimmedNote`, every `AppData.HarnessTrimNoteEvery`).
     */
    let trimmed_turns = 0;
    let warned_steps = isUnlimitedLimit(max_steps) || max_steps < AppData.HarnessStepsLowMinSteps;
    /**
     * The prompt tokens past which the run is told to land the work
     * (`AppData.HarnessRunTokensWarnShare` of its budget), and whether it has
     * been told. A run with no token budget has none to be near the end of.
     */
    const tokens_warn_at =
        typeof max_prompt_tokens == "number" && max_prompt_tokens > 0
            ? Math.floor(max_prompt_tokens * AppData.HarnessRunTokensWarnShare)
            : Infinity;
    let warned_tokens = tokens_warn_at == Infinity;
    /**
     * A quarter of the budget with nothing produced yet: research is not
     * progress, and a run that spends the whole budget reading lands its
     * report but none of the work (one task run did exactly that: 195
     * turns, 30M tokens, zero rows written, Nov 2026). Said once, while
     * there is still budget to land the rest.
     */
    const commits_at =
        typeof max_prompt_tokens == "number" && max_prompt_tokens > 0
            ? Math.floor(max_prompt_tokens * AppData.HarnessRunTokensCommitShare)
            : Infinity;
    let told_to_commit = commits_at == Infinity;
    /**
     * The wrap up is announced once, and may save until it has: a run told
     * to stop with its report unwritten gets a turn to write it (at most
     * `WrapUpSavingTurns`, so it always ends).
     */
    let wrap_up_announced = false;
    let saving_turns = 0;
    /**
     * The wrap up had its one round of tools (saving, or handing the work
     * on): the next turn offers none, so the run always ends.
     */
    let used_wrap_turn = false;

    /**
     * One trace entry, kept only when the run has somewhere to put it. A
     * trace is for reading afterwards, never a reason to fail the work.
     */
    const traced = async (entry: HarnessTrace) => {
        if (!trace) return;

        try {
            await trace(entry);
        } catch {
            /* the debug view is never worth a failed run */
        }
    };

    /**
     * The answer checked against the app's own record before it goes out:
     * files, tasks and settings it names, and work it says is under way. A
     * note comes back and the answer is written again with it, up to
     * `AppData.HarnessReviewRewrites`; a model that writes the same message
     * back is told it did (`repeatedAnswerNote`) rather than spending its
     * next rewrite on a copy. Past that the run stops: an answer the app
     * knows is wrong is never sent (`review_note`).
     */
    const checkAnswer = async ({
        text,
        index,
        final = false,
        status,
    }: {
        text: string;
        index: number;
        /**
         * The wrap up, or a turn that must not be written again: a fault
         * refuses the answer here. A rewrite the review is waiting on is
         * the run's last look, so it is not sent back into another turn.
         */
        final?: boolean;
        /**
         * What `send_reply` declared: the review reads a claim of work
         * against it, so a `done` message can't say work is under way and a
         * `working` one must have a run behind it.
         */
        status?: ReplyStatus;
    }) => {
        if (!review) return { verdict: "passed" as const };

        const note = await review({ text, tool_uses, status }).catch(async (error) => {
            /**
             * A reviewer that throws passes the answer, which is the safe
             * thing to do with the user's reply, but it must not read like a
             * review that found nothing: a reviewer that is broken every
             * time leaves every answer unchecked, and nothing said so.
             */
            await logError({
                title: "Reviewing a reply failed, so its answer went out unchecked",
                error,
            }).catch(() => null);

            return null;
        });

        if (!note) return { verdict: "passed" as const };

        await traced({ kind: "event", index, name: "review", text: note });

        const written = text.replace(/\s+/g, " ").trim();
        const repeated = written !== "" && written === faulted_answer;

        faulted_answer = written;
        review_rewrites += 1;

        if (final || review_rewrites > AppData.HarnessReviewRewrites) return { verdict: "refused" as const, note };

        pushUserTurn({ transcript, content: repeated ? `${note}\n\n${repeatedAnswerNote}` : note });
        review_pending = true;

        return { verdict: "sent_back" as const };
    };

    for (let index = 0; index <= step_ceiling + 1 + WrapUpSavingTurns; index++) {
        if (signal.aborted) {
            throw new HarnessError({ message: `Cancelled.`, code: "aborted" });
        }

        const out_of_steps = index >= step_ceiling;
        const out_of_tokens = Boolean(
            typeof max_prompt_tokens == "number" &&
                max_prompt_tokens > 0 &&
                usage.prompt_tokens >= max_prompt_tokens,
        );
        const wrap_up = out_of_steps || out_of_tokens;
        /**
         * The saving turn: only the tools a wrap up has left. Without one
         * of them, or once it had its round, the wrap up is the old one,
         * with no tools at all, so the run always ends.
         */
        const wrap_up_saving =
            wrap_up && !used_wrap_turn && saving_turns < WrapUpSavingTurns && wrap_tools.length > 0;

        if (wrap_up && !wrap_up_announced) {
            wrap_up_announced = true;

            if (incoming_notes?.wrap_up) await takeIncoming({ note: incoming_notes.wrap_up, index, counted: false });

            /**
             * The machine's own account of the work, when the caller has
             * one: the tree says what is on disk, and the run's memory of
             * writing it is what drifts.
             */
            const wrap_note = wrap_up_note ? await Promise.resolve(wrap_up_note()).catch(() => "") : "";

            if (wrap_note) {
                pushUserTurn({ transcript, content: wrap_note });
                await traced({ kind: "event", index, name: "worktree", text: wrap_note });
            }

            pushUserTurn({
                transcript,
                content: wrapUpPrompt({
                    uses: tool_uses,
                    reason: out_of_steps ? "steps" : "tokens",
                    saving: wrap_up_saving ? save_tools.map((tool) => tool.name) : [],
                    hand_off: wrap_up_saving ? hand_off_tools.map((tool) => tool.name) : [],
                    answer: answer_tools.map((tool) => tool.name),
                }),
            });

            await traced({
                kind: "event",
                index,
                name: "wrap_up",
                text: `${out_of_steps ? "Out of steps" : "Out of tokens"}. ${wrap_tools.length ? `It has one turn left with ${wrap_tools.map((tool) => tool.name).join(", ")}.` : "It has no tool left and must answer now."}`,
            });
        }

        if (wrap_up_saving) saving_turns++;

        const definitions = wrap_up
            ? wrap_up_saving
                ? wrap_definitions
                : answer_definitions
            : definitionsNow();

        /**
         * Sized for the model the run is on (or will start on). A fallback
         * with a smaller window gets a 400 and the next model is tried.
         */
        const model = (candidates.find((c) => c.key == prefer_key) || candidates[0])?.model;

        const fit = fitTranscriptToContext({
            system: run_system,
            transcript,
            context_length: model?.context_length || AppData.HarnessUnknownContextWindow,
            budget_tokens: typeof context_budget == "number" ? context_budget : undefined,
            tools_chars: JSON.stringify(definitions).length,
        });

        /**
         * Everything trimmable was trimmed and it still doesn't fit: what is
         * over is what the user wrote, which is never cut. Told once, so it
         * works in pieces and says what it could not reach instead of
         * inventing the rest (`oversizedRequestNote`).
         */
        if (fit.over_budget && !told_over_budget) {
            told_over_budget = true;

            const note = oversizedRequestNote({ budget: fit.budget });

            pushUserTurn({ transcript, content: note });
            await traced({ kind: "event", index, name: "over_budget", text: note });
        }

        /**
         * Trimming leaves no trace: a run that re-reads what it read before
         * is not learning it twice, it is paying for it twice, and it has no
         * way to know the earlier readings were cut (`contextTrimmedNote`).
         */
        if (fit.trimmed > 0) {
            trimmed_turns += 1;

            if (trimmed_turns % AppData.HarnessTrimNoteEvery == 0) {
                const note = contextTrimmedNote({ trimmed: trimmed_turns });

                pushUserTurn({ transcript, content: note });
                await traced({ kind: "event", index, name: "trimmed", text: note });
            }
        }

        const turn_started_at = Date.now();

        const answer = await generate({
            messages: [{ role: "system", content: run_system }, ...transcript],
            tools: definitions.length ? definitions : undefined,
            candidates,
            prefer_key,
            signal,
            media_cache,
            bot_id,
            workspace_id,
            limits: call_limits,
        });

        prefer_key = answer.candidate.key;
        usage.prompt_tokens += answer.usage?.prompt_tokens || 0;
        usage.completion_tokens += answer.usage?.completion_tokens || 0;
        usage.cost += answer.usage?.cost || 0;

        /**
         * Only the tools this turn offered: at the wrap up that is the
         * saving ones, and on the last turn only the answer tool, which is
         * the one way a required closing message still goes out.
         */
        const offered = wrap_up
            ? wrap_up_saving
                ? answer.tool_calls
                : answer.tool_calls.filter((call) => answer_tools.some((tool) => tool.name == call.name))
            : answer.tool_calls;
        const tool_calls = offered.filter((call) => !wrap_up || wrap_tools.some((tool) => tool.name == call.name));
        const reply_call = tool_calls.filter((call) => call.name === SendReplyToolName).at(-1);
        const reply_status = reply_call ? replyStatusFromCall({ call: reply_call }) : undefined;

        /**
         * What the app would never show as its own word comes out before
         * anything reads the answer: a setting pill that leads nowhere and a
         * record line this run's tools don't support are text, and sending
         * the whole answer back for one costs a rewrite and, on the third,
         * the answer (`sanitizeAnswerText`).
         */
        if (answer.text) answer.text = sanitizeAnswerText({ text: answer.text });

        /**
         * A saving turn that reached for anything else is told what it has
         * left, and gets that one round again (never more, so the run
         * ends).
         */
        if (wrap_up_saving && answer.tool_calls.length && !tool_calls.length) {
            pushUserTurn({
                transcript,
                content: `Only ${wrap_tools.map((tool) => tool.name).join(" and ")} can still be called in this run. Nothing else you call will run. Save the report or deliverable with one of them, or answer with what you have.`,
            });
            continue;
        }

        /**
         * On the last turn only the answer tool is offered: a turn that
         * reaches for anything else beside it would have that call silently
         * dropped, and the message could say it happened. Refuse the whole
         * turn and say what is left.
         */
        if (
            wrap_up &&
            !wrap_up_saving &&
            answer_tools.length > 0 &&
            answer.tool_calls.some((call) => !answer_tools.some((tool) => tool.name == call.name))
        ) {
            /**
             * This is the last turn, so there is no next one to try again
             * on: the message would be a draft the app cannot vouch for.
             */
            return {
                text: "",
                review_note: `Only ${answer_tools.map((tool) => tool.name).join(" and ")} can end this run, and this turn called something else beside it, so no message was sent.`,
                messages: transcript,
                steps: index + 1,
                candidate: answer.candidate,
                usage,
                tool_uses,
            };
        }

        transcript.push({
            role: "assistant",
            content: answer.text,
            ...(tool_calls.length ? { tool_calls } : {}),
        });

        await onStep?.({
            index,
            text: answer.text,
            tool_calls,
            candidate: answer.candidate,
        });

        await traced({
            kind: "turn",
            index,
            model: answer.candidate.model.name || answer.candidate.model.slug,
            provider: answer.candidate.provider.name || null,
            text: answer.text,
            reasoning: answer.reasoning ?? null,
            tool_calls: tool_calls.map((call) => ({ name: call.name, arguments: call.arguments })),
            usage: answer.usage ?? null,
            finish_reason: answer.finish_reason ?? null,
            duration_ms: Date.now() - turn_started_at,
        });

        /**
         * An answer the user wrote past is drafted again. Not on the wrap
         * up: the run is out of steps, and a later reply picks them up.
         * A rewrite the review is still waiting on is checked first: taking
         * in a new message here would skip the check the send-back exists for.
         */
        if (
            !tool_calls.length &&
            !wrap_up &&
            !review_pending &&
            (await takeIncoming({ note: incoming_notes?.redraft || RedraftNote, index }))
        ) {
            await traced({
                kind: "event",
                index,
                name: "redraft",
                text: "The user wrote again before this answer went out, so it was written again with that in mind.",
            });
            continue;
        }

        /**
         * A required closing answer is never prose alone: text without
         * `send_reply` is a draft, and the app does not send it. Told a
         * bounded number of times (`AppData.HarnessReplyDraftsMax`), then
         * the run fails honestly instead of turning a promise into a
         * message.
         */
        if (require_closing_answer && !tool_calls.length) {
            /**
             * The last wrap-up turn has no next turn, so a draft there is
             * the end: returning it as an answer is exactly the hole this
             * protocol closes.
             */
            if (!(wrap_up && !wrap_up_saving) && reply_drafts < AppData.HarnessReplyDraftsMax) {
                reply_drafts += 1;
                pushUserTurn({ transcript, content: replyDraftNote });
                await traced({ kind: "event", index, name: "reply_draft", text: replyDraftNote });
                continue;
            }

            return {
                text: "",
                review_note: replyDraftNote,
                messages: transcript,
                steps: index + 1,
                candidate: answer.candidate,
                usage,
                tool_uses,
            };
        }

        if (!tool_calls.length && (!wrap_up || review_pending)) {
            review_pending = false;

            const check = await checkAnswer({ text: answer.text || "", index, final: wrap_up });

            if (check.verdict === "refused") {
                /**
                 * A fault the app can take out is taken out instead of the
                 * whole answer: what is left is what the tools support, said
                 * to be part of the answer, so three faults no longer cost a
                 * user an answer that was right.
                 */
                const repaired = repairAnswerText({ text: answer.text || "" });

                if (repaired.changed && repaired.text) {
                    /**
                     * The repair only takes out claims of work under way; a
                     * dead file or task ref it leaves behind would still ship
                     * (M3). So the repaired text is checked again, and goes
                     * out only once the app's record supports all of it.
                     */
                    const recheck = await checkAnswer({ text: repaired.text, index, final: wrap_up });

                    if (recheck.verdict === "passed") {
                        await traced({
                            kind: "event",
                            index,
                            name: "repaired",
                            text: repairedAnswerNote,
                        });

                        return {
                            text: `${repaired.text}\n\n${repairedAnswerNote}`,
                            messages: transcript,
                            steps: index + 1,
                            candidate: answer.candidate,
                            usage,
                            tool_uses,
                        };
                    }
                }

                return {
                    text: "",
                    review_note: check.note,
                    messages: transcript,
                    steps: index + 1,
                    candidate: answer.candidate,
                    usage,
                    tool_uses,
                };
            }

            if (check.verdict === "sent_back") continue;

            /**
             * A wrap-up rewrite the review let through is the answer. The
             * turn below is the ordinary wrap up, which a pending review
             * must not fall into and be checked a second time.
             */
            if (wrap_up) {
                const said = (answer.text || "").trim();

                return {
                    text: said || `I ran out of steps before I could finish.`,
                    messages: transcript,
                    steps: index + 1,
                    candidate: answer.candidate,
                    usage,
                    tool_uses,
                };
            }
        }

        if (!tool_calls.length) {
            /**
             * Whitespace alone is no answer: it would land as an empty bubble
             * (`run-bot-reply` treats it as none and fails with a reason).
             */
            const said = (answer.text || "").trim();

            return {
                text: said || (wrap_up ? `I ran out of steps before I could finish.` : ""),
                messages: transcript,
                steps: index + 1,
                candidate: answer.candidate,
                usage,
                tool_uses,
            };
        }

        if (wrap_up_saving) used_wrap_turn = true;

        const shown: { tool_name: string; images: HarnessToolImage[] }[] = [];

        for (const call of tool_calls) {
            const repeat_key = repeatToolCallKey({ call });
            const remembered = repeat_key ? repeated_reads.get(repeat_key) : undefined;
            /**
             * A read answered from a step is answered only while its output
             * is still in the prompt: trimming cut it down to its two ends
             * (`fitTranscriptToContext`), which no longer holds what the run
             * was reading. Pointing at it then made the model retry the same
             * call until the token budget ran out.
             */
            const already_read = remembered && transcript.includes(remembered.message) ? remembered.step : undefined;
            const call_key = toolCallKey({ call });
            const failed_before = call_key ? failed_calls.get(call_key) : undefined;
            const give_up =
                failed_before !== undefined && failed_before.attempts > AppData.HarnessSameFailureRetries;

            const result: ToolCallResult =
                already_read !== undefined
                    ? {
                          text: alreadyRanToolNote({ name: call.name, step: already_read }),
                          images: [],
                          duration_ms: 0,
                          ok: true,
                      }
                    : give_up
                      ? {
                            text: failedToolCallNote({
                                name: call.name,
                                step: failed_before.step,
                                attempts: failed_before.attempts,
                                error: failed_before.error,
                            }),
                            images: [],
                            duration_ms: 0,
                            ok: false,
                        }
                      : await runToolCall({ call, tools: run_tools, signal });

            const { text: content, images } = result;
            const ok = result.ok;

            /**
             * A deferred tool called without loading it ran all the same;
             * it stays loaded from here on.
             */
            if (defer && deferrable.some((tool) => tool.name == call.name) && !loaded.includes(call.name)) {
                loaded.push(call.name);
            }

            tool_uses.push({ name: call.name, ok });

            await traced({
                kind: "tool",
                index,
                name: call.name,
                arguments: call.arguments,
                result: content,
                ok,
                images: images.length,
                duration_ms: result.duration_ms,
                repeat_of: (give_up ? failed_before.step : already_read) ?? null,
            });

            if (!repeat_key) {
                repeated_reads.clear();
            } else if (already_read === undefined) {
                if (!ok) repeated_reads.delete(repeat_key);
                else if (remembered) repeated_reads.delete(repeat_key);
            }

            if (give_up) {
                failed_calls.set(call_key!, { ...failed_before, attempts: failed_before.attempts + 1 });
            } else if (!ok) {
                if (call_key) {
                    const earlier = failed_calls.get(call_key);

                    failed_calls.set(call_key, {
                        step: earlier?.step ?? index,
                        attempts: (earlier?.attempts ?? 0) + 1,
                        error: earlier?.error ?? clipFailure({ text: content }),
                    });
                }
            } else if (!call_key || !isRepeatableTool({ name: call.name })) {
                failed_calls.clear();
            }

            const tool_message: HarnessMessage = { role: "tool", tool_call_id: call.id, content };

            transcript.push(tool_message);

            if (repeat_key && already_read === undefined && ok) {
                repeated_reads.set(repeat_key, { step: index, message: tool_message });
            }

            if (images.length) shown.push({ tool_name: call.name, images });
        }

        /**
         * An answer that called a card is the whole reply: the question
         * waits for the user, and what comes next was just offered. Going on
         * would send the next turn's short line in its place, since the reply
         * is only the run's last message (`ClosingToolNames`). A turn that
         * called nothing at all is still a whole answer (the check below).
         */
        const called_card = tool_calls.some((call) => isClosingTool({ name: call.name }));
        const called_send_reply = tool_calls.some((call) => call.name === SendReplyToolName);
        const closing = tool_calls.every((call) => isClosingTool({ name: call.name }));
        /**
         * A required closing answer needs `send_reply` itself, not just any
         * closing call: a card alone says what to ask, never that work is
         * running, and the status it declares is what the review reads.
         */
        const closing_required = !require_closing_answer || called_send_reply;
        /**
         * Only a closing call the tool refused is a failure: it put nothing
         * up, and a message written as if it had points at a card no one can
         * see. A turn that did other work beside a card it created is mixed,
         * not failed - saying "the card was not created" there sent the model
         * to ask again, which the once-per-run guard refuses, and the same
         * note looped for the whole budget (H1).
         */
        const closing_uses = tool_uses.slice(-tool_calls.length).filter((use) => isClosingTool({ name: use.name }));
        const closing_failed = closing_uses.some((use) => !use.ok);
        const closing_worked = closing && !closing_failed && closing_required;

        if (called_card && (closing_failed || !closing || !closing_required)) {
            /**
             * Bounded: past the retries a card-only turn ends on the answer
             * it wrote, reviewed like any reply, rather than looping on a
             * card it can't put up. A required closing message is refused
             * instead: without `send_reply` there is no honest message.
             */
            if (closing_retries >= AppData.MaxClosingRetries || (wrap_up && !wrap_up_saving)) {
                if (require_closing_answer) {
                    return {
                        text: "",
                        review_note: closing_failed
                            ? replyClosingFailedNote
                            : !closing
                              ? replyClosingMixedNote
                              : replyClosingRequiredNote,
                        messages: transcript,
                        steps: index + 1,
                        candidate: answer.candidate,
                        usage,
                        tool_uses,
                    };
                }

                const check = await checkAnswer({ text: answer.text || "", index, final: wrap_up && !wrap_up_saving });

                return {
                    text: check.verdict === "refused" ? "" : answer.text || "",
                    ...(check.verdict === "refused" ? { review_note: check.note } : {}),
                    messages: transcript,
                    steps: index + 1,
                    candidate: answer.candidate,
                    usage,
                    tool_uses,
                };
            }

            closing_retries++;

            const note = closing_failed
                ? called_send_reply || require_closing_answer
                    ? replyClosingFailedNote
                    : closingFailedNote
                : !closing
                  ? called_send_reply
                      ? replyClosingMixedNote
                      : closingMixedNote
                  : replyClosingRequiredNote;
            const name = closing_failed ? "closing_failed" : !closing ? "closing_mixed" : "closing_required";

            pushUserTurn({ transcript, content: note });
            await traced({ kind: "event", index, name, text: note });
            continue;
        }

        /**
         * A card with nothing beside it answers nothing, and the run would
         * go on to work on the very thing it just asked about. Told once,
         * and the run ends on the sentence it writes (`closingNoTextNote`).
         */
        if (closing_worked && called_card && !(answer.text || "").trim()) {
            const no_text_note = called_send_reply ? replyNoTextNote : closingNoTextNote;

            if (!told_closing_text && !(wrap_up && !wrap_up_saving)) {
                told_closing_text = true;
                pushUserTurn({ transcript, content: no_text_note });
                await traced({ kind: "event", index, name: "closing_no_text", text: no_text_note });
                continue;
            }

            return {
                text: "",
                review_note: no_text_note,
                messages: transcript,
                steps: index + 1,
                candidate: answer.candidate,
                usage,
                tool_uses,
            };
        }

        if (closing_worked && answer.text) {
            /**
             * Checked before it goes out, as any reply is: a note comes
             * back and the answer is written again (the card stays on the
             * reply, its ref is already recorded).
             */
            const final_turn = wrap_up && !wrap_up_saving;
            const check = await checkAnswer({ text: answer.text, index, status: reply_status, final: final_turn });

            if (check.verdict === "refused") {
                const repaired = repairAnswerText({ text: answer.text });

                if (repaired.changed && repaired.text) {
                    // Checked again, as the reply path is: a dead ref the
                    // repair leaves behind must not ship (M3).
                    const recheck = await checkAnswer({ text: repaired.text, index, status: reply_status, final: final_turn });

                    if (recheck.verdict === "passed") {
                        await traced({
                            kind: "event",
                            index,
                            name: "repaired",
                            text: repairedAnswerNote,
                        });

                        return {
                            text: `${repaired.text}\n\n${repairedAnswerNote}`,
                            messages: transcript,
                            steps: index + 1,
                            candidate: answer.candidate,
                            usage,
                            tool_uses,
                            status: reply_status,
                        };
                    }
                }

                return {
                    text: "",
                    review_note: check.note,
                    messages: transcript,
                    steps: index + 1,
                    candidate: answer.candidate,
                    usage,
                    tool_uses,
                };
            }

            if (check.verdict === "sent_back") continue;

            return {
                text: answer.text,
                messages: transcript,
                steps: index + 1,
                candidate: answer.candidate,
                usage,
                tool_uses,
                status: reply_status,
            };
        }

        /**
         * Screenshots and other tool images follow the results in a user
         * turn. A model that sees gets them as they are when the text
         * setting allows it (`textSeesImages`); otherwise `generateText`
         * has them read first.
         */
        supersedeToolOutputs({ transcript });

        if (shown.length) {
            pushUserTurn({ transcript, content: toolImagesTurn({ shown }) });
            dropOldToolImages({
                transcript,
                keep: AppData.HarnessToolImagesKept,
                cache: media_cache,
            });
        }

        await takeIncoming({ note: incoming_notes?.working || IncomingMessagesNote, index });

        /**
         * The run wrote for the user and then carried on: that message never
         * goes out, and a run that doesn't know it ends with the tail of an
         * answer it already wrote. Told once, with the message still in the
         * transcript to write again.
         */
        if (!told_answer_lost && answer.text) {
            told_answer_lost = true;

            pushUserTurn({ transcript, content: answerNotSentNote });
            await traced({ kind: "event", index, name: "answer_not_sent", text: answerNotSentNote });
        }

        /**
         * What this turn spent: past the budget, the wrap up says it better
         * (`wrapUpPrompt`) than either note below.
         */
        const spent_out =
            typeof max_prompt_tokens == "number" && max_prompt_tokens > 0 && usage.prompt_tokens >= max_prompt_tokens;

        /**
         * Something produced, or a quarter of the budget gone without it:
         * said before the steps are nearly out, so a run still has room to
         * land the work rather than reporting on it. A run that has written
         * anything at all is left alone; one that landed its work through a
         * shell says so (`commitEarlyNote`).
         */
        if (tool_uses.some((used) => used.ok && isWritingTool({ name: used.name }))) told_to_commit = true;

        if (!told_to_commit && !spent_out && usage.prompt_tokens >= commits_at) {
            told_to_commit = true;

            const note = commitEarlyNote({ spent: usage.prompt_tokens, of: max_prompt_tokens as number });

            pushUserTurn({ transcript, content: note });
            await traced({ kind: "event", index, name: "commit_early", text: note });
        }

        /**
         * Steps left before the wrap up, once the next turn is taken.
         * An unlimited run is never told it's nearly out: it has no budget
         * to be near the end of.
         */
        const left = step_ceiling - (index + 1);

        if (!warned_steps && !isUnlimitedLimit(max_steps) && left <= warn_at) {
            warned_steps = true;
            pushUserTurn({ transcript, content: stepsLowNote({ left }) });
            await traced({ kind: "event", index, name: "steps_low", text: stepsLowNote({ left }) });
        }

        /**
         * Half the token budget gone, once: every further turn resends this
         * whole conversation, so what the run does next is paid for out of
         * the answer. Skipped when the turn just spent the budget out: the
         * wrap up says it better (`wrapUpPrompt`).
         */
        if (!warned_tokens && !spent_out && usage.prompt_tokens >= tokens_warn_at) {
            warned_tokens = true;

            const tokens_left = (max_prompt_tokens as number) - usage.prompt_tokens;

            pushUserTurn({ transcript, content: tokensLowNote({ left: tokens_left }) });
            await traced({ kind: "event", index, name: "tokens_low", text: tokensLowNote({ left: tokens_left }) });
        }
    }

    throw new Error(`Unreachable: the text loop ended without an answer.`);

    /**
     * Adds what the user wrote since the last look, after `note`. True when
     * there was anything. `counted` says whether the run will answer what it
     * read: the wrap up writes the answer it already had to, so a message
     * taken in there is left for its own reply (`run-bot-reply`), not marked
     * answered by an answer written before it arrived.
     */
    async function takeIncoming({ note, index, counted = true }: { note: string; index: number; counted?: boolean }) {
        const turns = (await incoming?.({ counted })) || [];
        const user_turns = turns.filter((turn) => turn.role == "user");

        if (!user_turns.length) return false;

        pushUserTurn({ transcript, content: note });

        for (const turn of user_turns) {
            pushUserTurn({ transcript, content: turn.content });
        }

        await traced({
            kind: "event",
            index,
            name: "incoming",
            text: user_turns
                .map((turn) => (typeof turn.content == "string" ? turn.content : ""))
                .filter(Boolean)
                .join("\n\n"),
        });

        return true;
    }
}

/**
 * Characters of a failure a repeated call's note keeps: a failing command
 * can print a whole traceback, and the note is resent with every turn
 * after it.
 */
const FailureNoteChars = 400;

/**
 * The error a repeated call's note reuses, cut to `FailureNoteChars`.
 */
const clipFailure = ({ text }: { text: string }) =>
    text.length <= FailureNoteChars ? text : `${text.slice(0, FailureNoteChars)}...`;
