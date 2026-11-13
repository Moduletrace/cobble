import { AppData } from "@/src/data/app-data";
import { alreadyRanToolNote, commitEarlyNote, failedToolCallNote, tokensLowNote } from "@/src/data/harness-prompts";
import { isUnlimitedLimit, type RunLimit, UnlimitedLimit } from "@/src/utils/run-limit";
import HarnessError from "../harness-error";
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
     * is written again with them in mind.
     */
    incoming?: () => Promise<HarnessMessage[]>;
    /**
     * What the run is told with what came in: `working` after a round of
     * tools, `redraft` past an answer that hadn't gone out (defaults
     * `IncomingMessagesNote`, `RedraftNote`). With `wrap_up`, what came in
     * by the wrap up is added before it too, for a run nothing picks up
     * after (a task); without it a later reply does.
     */
    incoming_notes?: { working?: string; redraft?: string; wrap_up?: string };
    /**
     * Checks an answer before it's returned, with the tool calls the run
     * made. A note sends the answer back to be written again with it, once
     * per run; null lets it through. Not on the wrap up, and a check that
     * throws lets the answer through.
     */
    review?: (params: { text: string; tool_uses: HarnessToolUse[] }) => Promise<string | null | undefined>;
    /**
     * The bot the run is for: its own models are used where it has them.
     */
    bot_id?: number | string;
    /**
     * The workspace the call is in: its models win over the bot's.
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
 * the rest as a task (`start_task`) while it can still call a tool,
 * rather than saying it will do it later. The app runs it as soon as the
 * reply is out.
 */
export const WrapUpHandOffToolNames = ["start_task"];

/**
 * Every tool the wrap up may still call (`WrapUpSaveToolNames` and
 * `WrapUpHandOffToolNames`): those the run has, in its own order.
 */
export const WrapUpToolNames = [...WrapUpSaveToolNames, ...WrapUpHandOffToolNames];

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
}: {
    uses: HarnessToolUse[];
    reason?: "steps" | "tokens";
    saving?: string[];
    hand_off?: string[];
}) =>
    `${reason == "tokens" ? "This run has used all the tokens it may spend." : "You've used every step this run allows."} ${wrapUpToolsPrompt({
        saving,
        hand_off,
    })} Report what you did, what is left, and anything you need from the user.

The tools you actually called this run: ${describeToolUses({ uses })}. Nothing else happened. Don't say you saved, created, changed or sent anything this list doesn't show; what you meant to do and didn't is still left, so say so.`;

/**
 * What the wrap up may still call, said in one line: save the work, hand
 * on what it can't finish, or neither.
 */
const wrapUpToolsPrompt = ({ saving, hand_off }: { saving: string[]; hand_off: string[] }) => {
    if (!saving.length && !hand_off.length) return `Don't call any more tools.`;

    return [
        saving.length
            ? `You have one turn to save what the user needs: ${saving.join(" and ")} are still yours. Call only what saves the work (the report or deliverable) and nothing else, then report.`
            : "",
        saving.length
            ? `If real work is left that this run can't finish, call ${hand_off.join(" or ")} with a complete brief of what's left: it runs after this turn and posts its own result.`
            : hand_off.length
              ? `You have one turn to hand the work on: ${hand_off.join(" or ")} is still yours. If real work is left, call it with a complete brief of what's left: it runs after this turn and posts its own result.`
              : "",
        `After this turn no tool is left, so anything unsaved is lost, and so is work you only say you'll do later.`,
    ]
        .filter(Boolean)
        .join(" ");
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
 * (`WrapUpToolNames`: what saves the work, and `start_task` for the rest),
 * then one with none. With neither set (unlimited), the run ends when the
 * model answers without calling a tool, or when its job's deadline or its
 * abort signal ends it. An answer `review` finds fault
 * with is written again once.
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
    onStep,
    trace,
    incoming,
    incoming_notes,
    review,
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
     * (`repeatToolCallKey`) and the step it was. A read repeated word for
     * word gets this answer instead of being run again, and anything that
     * may have written forgets them: a file read once, then edited, is
     * read again.
     */
    const repeated_reads = new Map<string, number>();
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
    const wrap_definitions = wrap_tools.map((tool) => all_definitions.get(tool.name)!);
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
    let prefer_key: string | undefined;
    let reviewed = false;
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

            if (incoming_notes?.wrap_up) await takeIncoming({ note: incoming_notes.wrap_up, index });

            pushUserTurn({
                transcript,
                content: wrapUpPrompt({
                    uses: tool_uses,
                    reason: out_of_steps ? "steps" : "tokens",
                    saving: wrap_up_saving ? save_tools.map((tool) => tool.name) : [],
                    hand_off: wrap_up_saving ? hand_off_tools.map((tool) => tool.name) : [],
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

        const definitions = wrap_up_saving ? wrap_definitions : wrap_up ? [] : definitionsNow();

        /**
         * Sized for the model the run is on (or will start on). A fallback
         * with a smaller window gets a 400 and the next model is tried.
         */
        const model = (candidates.find((c) => c.key == prefer_key) || candidates[0])?.model;

        fitTranscriptToContext({
            system: run_system,
            transcript,
            context_length: model?.context_length || AppData.HarnessUnknownContextWindow,
            budget_tokens: typeof context_budget == "number" ? context_budget : undefined,
            tools_chars: JSON.stringify(definitions).length,
        });

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
         * saving ones, and the last turn offers none.
         */
        const tool_calls = (wrap_up ? (wrap_up_saving ? answer.tool_calls : []) : answer.tool_calls).filter(
            (call) => !wrap_up || wrap_tools.some((tool) => tool.name == call.name),
        );

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
         */
        if (
            !tool_calls.length &&
            !wrap_up &&
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

        if (!tool_calls.length && !wrap_up && review && !reviewed) {
            reviewed = true;

            const note = await review({ text: answer.text || "", tool_uses }).catch(() => null);

            if (note) {
                await traced({ kind: "event", index, name: "review", text: note });
                pushUserTurn({ transcript, content: note });
                continue;
            }
        }

        if (!tool_calls.length) {
            return {
                text:
                    answer.text ||
                    (wrap_up ? `I ran out of steps before I could finish.` : ""),
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
            const already_read = repeat_key ? repeated_reads.get(repeat_key) : undefined;
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
                        }
                      : await runToolCall({ call, tools: run_tools, signal });

            const { text: content, images } = result;
            const ok = !give_up && !content.startsWith("Error:");

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
                if (content.startsWith("Error:")) repeated_reads.delete(repeat_key);
                else repeated_reads.set(repeat_key, index);
            }

            if (give_up) {
                failed_calls.set(call_key!, { ...failed_before, attempts: failed_before.attempts + 1 });
            } else if (content.startsWith("Error:")) {
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

            transcript.push({ role: "tool", tool_call_id: call.id, content });

            if (images.length) shown.push({ tool_name: call.name, images });
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
     * there was anything.
     */
    async function takeIncoming({ note, index }: { note: string; index: number }) {
        const turns = (await incoming?.()) || [];
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
