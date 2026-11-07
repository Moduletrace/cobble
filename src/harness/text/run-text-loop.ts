import { AppData } from "@/src/data/app-data";
import HarnessError from "../harness-error";
import resolveHarnessCandidates from "../resolve/resolve-harness-candidates";
import loadToolsTool from "../tools/load-tools-tool";
import runToolCall from "../tools/run-tool-call";
import toolDefinition from "../tools/tool-definition";
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
    max_steps?: number;
    /**
     * Prompt tokens the run may spend in all (`grabRunMaxPromptTokens`):
     * once its turns have sent this many, the next one is the wrap up.
     * Left out, only `max_steps` ends it.
     */
    max_prompt_tokens?: number;
    /**
     * The working context (`grabContextBudgetTokens`): the most each turn
     * sends before old tool output is trimmed, whatever the model's
     * window. Left out, the window decides.
     */
    context_budget?: number;
    signal?: AbortSignal;
    /**
     * Called after each model turn, before its tools run. Use it for
     * progress and checkpoints.
     */
    onStep?: (step: TextLoopStep) => Promise<void> | void;
    /**
     * The user's turns that arrived since the run started (and since the
     * last call), read after each round of tools and before an answer is
     * returned. They join the transcript, so a message sent while the bot
     * works can change what it does, and an answer they arrive in time for
     * is written again with them in mind.
     */
    incoming?: () => Promise<HarnessMessage[]>;
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
 * Told on the last step, with the app's record of the tools the run
 * called (`describeToolUses`): out of steps, a model tends to report the
 * work it planned as done. `tokens` when the run's token budget ended it
 * rather than its steps.
 */
export const wrapUpPrompt = ({ uses, reason = "steps" }: { uses: HarnessToolUse[]; reason?: "steps" | "tokens" }) =>
    `${reason == "tokens" ? "This run has used all the tokens it may spend." : "You've used every step this run allows."} Don't call any more tools. Report what you did, what is left, and anything you need from the user.

The tools you actually called this run: ${describeToolUses({ uses })}. Nothing else happened. Don't say you saved, created, changed or sent anything this list doesn't show; what you meant to do and didn't is still left, so say so.`;

/**
 * Told once, `AppData.HarnessStepsLowWarning` steps before the wrap up,
 * while the run can still save what it has: the wrap up has no tools, so a
 * report not written by then is lost.
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
 * model is asked to wrap up without tools. An answer `review` finds fault
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
    incoming,
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
    let prefer_key: string | undefined;
    let reviewed = false;
    let warned_steps = max_steps < AppData.HarnessStepsLowMinSteps;

    for (let index = 0; index <= max_steps; index++) {
        if (signal.aborted) {
            throw new HarnessError({ message: `Cancelled.`, code: "aborted" });
        }

        const out_of_tokens = Boolean(max_prompt_tokens && max_prompt_tokens > 0 && usage.prompt_tokens >= max_prompt_tokens);
        const wrap_up = index == max_steps || out_of_tokens;

        if (wrap_up) {
            pushUserTurn({
                transcript,
                content: wrapUpPrompt({ uses: tool_uses, reason: index == max_steps ? "steps" : "tokens" }),
            });
        }

        const definitions = definitionsNow();

        /**
         * Sized for the model the run is on (or will start on). A fallback
         * with a smaller window gets a 400 and the next model is tried.
         */
        const model = (candidates.find((c) => c.key == prefer_key) || candidates[0])?.model;

        fitTranscriptToContext({
            system: run_system,
            transcript,
            context_length: model?.context_length || AppData.HarnessAutoMinContext,
            budget_tokens: context_budget,
            tools_chars: wrap_up ? 0 : JSON.stringify(definitions).length,
        });

        const answer = await generate({
            messages: [{ role: "system", content: run_system }, ...transcript],
            tools: wrap_up || !definitions.length ? undefined : definitions,
            candidates,
            prefer_key,
            signal,
            media_cache,
            bot_id,
            workspace_id,
        });

        prefer_key = answer.candidate.key;
        usage.prompt_tokens += answer.usage?.prompt_tokens || 0;
        usage.completion_tokens += answer.usage?.completion_tokens || 0;
        usage.cost += answer.usage?.cost || 0;

        const tool_calls = wrap_up ? [] : answer.tool_calls;

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

        /**
         * An answer the user wrote past is drafted again. Not on the wrap
         * up: the run is out of steps, and a later reply picks them up.
         */
        if (!tool_calls.length && !wrap_up && (await takeIncoming({ note: RedraftNote }))) {
            continue;
        }

        if (!tool_calls.length && !wrap_up && review && !reviewed) {
            reviewed = true;

            const note = await review({ text: answer.text || "", tool_uses }).catch(() => null);

            if (note) {
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

        const shown: { tool_name: string; images: HarnessToolImage[] }[] = [];

        for (const call of tool_calls) {
            const { text: content, images } = await runToolCall({ call, tools: run_tools, signal });

            /**
             * A deferred tool called without loading it ran all the same;
             * it stays loaded from here on.
             */
            if (defer && deferrable.some((tool) => tool.name == call.name) && !loaded.includes(call.name)) {
                loaded.push(call.name);
            }

            tool_uses.push({ name: call.name, ok: !content.startsWith("Error:") });
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

        await takeIncoming({ note: IncomingMessagesNote });

        /**
         * Steps left before the wrap up, once the next turn is taken.
         */
        const left = max_steps - (index + 1);

        if (!warned_steps && left <= AppData.HarnessStepsLowWarning) {
            warned_steps = true;
            pushUserTurn({ transcript, content: stepsLowNote({ left }) });
        }
    }

    throw new Error(`Unreachable: the text loop ended without an answer.`);

    /**
     * Adds what the user wrote since the last look, after `note`. True when
     * there was anything.
     */
    async function takeIncoming({ note }: { note: string }) {
        const turns = (await incoming?.()) || [];
        const user_turns = turns.filter((turn) => turn.role == "user");

        if (!user_turns.length) return false;

        pushUserTurn({ transcript, content: note });

        for (const turn of user_turns) {
            pushUserTurn({ transcript, content: turn.content });
        }

        return true;
    }
}
