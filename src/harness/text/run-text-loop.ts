import { AppData } from "@/src/data/app-data";
import HarnessError from "../harness-error";
import resolveHarnessCandidates from "../resolve/resolve-harness-candidates";
import runToolCall from "../tools/run-tool-call";
import toolDefinition from "../tools/tool-definition";
import type {
    HarnessCandidate,
    HarnessMessage,
    HarnessTool,
    HarnessToolCall,
    HarnessUsage,
} from "../types";
import fitTranscriptToContext from "./fit-transcript-to-context";
import generateText from "./generate-text";

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
    tools?: HarnessTool[];
    max_steps?: number;
    signal?: AbortSignal;
    /**
     * Called after each model turn, before its tools run. Use it for
     * progress and checkpoints.
     */
    onStep?: (step: TextLoopStep) => Promise<void> | void;
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
};

const WrapUpPrompt = `You've used every step this run allows. Don't call any more tools. Report what you did, what is left, and anything you need from the user.`;

/**
 * The text harness at work: the model answers or calls tools, tool results
 * go back to it, and so on until it answers without calling a tool. Tools
 * run one at a time, in order. Stays on one model unless it fails. After
 * `max_steps` turns the model is asked to wrap up without tools.
 */
export default async function runTextLoop({
    system,
    messages,
    tools = [],
    max_steps = AppData.HarnessMaxToolSteps,
    signal = new AbortController().signal,
    onStep,
    bot_id,
    workspace_id,
    generate = generateText,
    resolveCandidates = () => resolveHarnessCandidates({ harness: "text", bot_id, workspace_id }),
}: Params): Promise<TextLoopResult> {
    const candidates = await resolveCandidates();
    const definitions = tools.map((tool) => toolDefinition({ tool }));
    const media_cache = new Map<string, string>();
    const transcript: HarnessMessage[] = [...messages];
    const usage: Required<HarnessUsage> = {
        prompt_tokens: 0,
        completion_tokens: 0,
        cost: 0,
    };
    let prefer_key: string | undefined;

    for (let index = 0; index <= max_steps; index++) {
        if (signal.aborted) {
            throw new HarnessError({ message: `Cancelled.`, code: "aborted" });
        }

        const wrap_up = index == max_steps;

        if (wrap_up) {
            transcript.push({ role: "user", content: WrapUpPrompt });
        }

        /**
         * Sized for the model the run is on (or will start on). A fallback
         * with a smaller window gets a 400 and the next model is tried.
         */
        const model = (candidates.find((c) => c.key == prefer_key) || candidates[0])?.model;

        fitTranscriptToContext({
            system,
            transcript,
            context_length: model?.context_length || AppData.HarnessAutoMinContext,
        });

        const answer = await generate({
            messages: [{ role: "system", content: system }, ...transcript],
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

        if (!tool_calls.length) {
            return {
                text:
                    answer.text ||
                    (wrap_up ? `I ran out of steps before I could finish.` : ""),
                messages: transcript,
                steps: index + 1,
                candidate: answer.candidate,
                usage,
            };
        }

        for (const call of tool_calls) {
            transcript.push({
                role: "tool",
                tool_call_id: call.id,
                content: await runToolCall({ call, tools, signal }),
            });
        }
    }

    throw new Error(`Unreachable: the text loop ended without an answer.`);
}
