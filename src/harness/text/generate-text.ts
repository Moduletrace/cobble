import HarnessError from "../harness-error";
import grabHarnessAdapter from "../providers/grab-harness-adapter";
import resolveHarnessCandidates from "../resolve/resolve-harness-candidates";
import withCandidates from "../resolve/with-candidates";
import type {
    HarnessCandidate,
    HarnessChatResult,
    HarnessMessage,
    HarnessToolDefinition,
} from "../types";
import prepareMessagesForModel from "./prepare-messages-for-model";
import stripThinkTags from "./strip-think-tags";

export type GenerateTextParams = {
    messages: HarnessMessage[];
    tools?: HarnessToolDefinition[];
    /**
     * Resolved for the text harness when not given.
     */
    candidates?: HarnessCandidate[];
    /**
     * Tried first: the model the run already uses.
     */
    prefer_key?: string;
    max_tokens?: number;
    temperature?: number;
    signal?: AbortSignal;
    /**
     * Media readings shared across calls of one run.
     */
    media_cache?: Map<string, string>;
    /**
     * The bot the turn is for: its own models are used where it has them.
     */
    bot_id?: number | string;
    /**
     * The workspace the call is in: its models win over the bot's.
     */
    workspace_id?: number | string | null;
};

export type GenerateTextResult = HarnessChatResult & {
    candidate: HarnessCandidate;
};

/**
 * One model turn on the text harness, falling back across its models.
 * Media the model can't take is read by the helper harnesses first.
 * Reasoning tags are stripped from the answer.
 */
export default async function generateText({
    messages,
    tools,
    candidates,
    prefer_key,
    max_tokens,
    temperature,
    signal = new AbortController().signal,
    media_cache = new Map(),
    bot_id,
    workspace_id,
}: GenerateTextParams): Promise<GenerateTextResult> {
    const { result, candidate } = await withCandidates({
        harness: "text",
        candidates:
            candidates || (await resolveHarnessCandidates({ harness: "text", bot_id, workspace_id })),
        prefer_key,
        run: async (candidate) => {
            const answer = await grabHarnessAdapter({
                kind: candidate.provider.kind,
            }).chat({
                candidate,
                messages: await prepareMessagesForModel({
                    messages,
                    model: candidate.model,
                    cache: media_cache,
                    signal,
                    bot_id,
                    workspace_id,
                }),
                tools,
                max_tokens,
                temperature,
                signal,
            });

            const text = answer.text ? stripThinkTags({ text: answer.text }) : "";

            if (!text && !answer.tool_calls.length) {
                throw new HarnessError({
                    message: `The model returned an empty answer.`,
                    retryable: true,
                    candidate_key: candidate.key,
                });
            }

            return { ...answer, text: text || null };
        },
    });

    return { ...result, candidate };
}
