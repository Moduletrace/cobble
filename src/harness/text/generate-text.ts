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
import buildUsageCall from "../usage/build-usage-call";
import recordHarnessUsage from "../usage/record-harness-usage";
import grabChatParams from "./grab-chat-params";
import flattenSentParams from "../usage/flatten-sent-params";
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
    /**
     * Overrides the saved generation settings (media reading wants 0).
     */
    params?: Record<string, number | string | { effort: string }>;
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
 * One turn as `withCandidates` carries it: the answer the provider gave,
 * with the reasoning tags stripped and an empty answer turned into null.
 */
type ChatAnswer = Omit<HarnessChatResult, "text"> & {
    text: string | null;
    /**
     * The generation settings sent to this candidate, for its usage row.
     */
    sent_params?: Record<string, number | string | { effort: string }>;
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
    params,
    signal = new AbortController().signal,
    media_cache = new Map(),
    bot_id,
    workspace_id,
}: GenerateTextParams): Promise<GenerateTextResult> {
    const resolved =
        candidates ||
        (await resolveHarnessCandidates({ harness: "text", bot_id, workspace_id }));
    const saved_params = params
        ? undefined
        : await grabChatParams({ harness: "text", bot_id, workspace_id });

    const { result, candidate } = await withCandidates<ChatAnswer>({
        harness: "text",
        candidates: resolved,
        prefer_key,
        on_success: async ({ candidate: answered, result: answer, failed }): Promise<void> =>
            await recordHarnessUsage({
                call: buildUsageCall({
                    harness: "text",
                    candidate: answered,
                    usage: answer.usage,
                    failed,
                    settings: {
                        ...(saved_params ? { settings_source: saved_params.source } : {}),
                        params: flattenSentParams({ params: answer.sent_params }),
                        ...(max_tokens ? { max_tokens } : {}),
                    },
                }),
            }),
        run: async (candidate) => {
            const sent_params = params || saved_params?.paramsFor(candidate.model);
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
                params: sent_params,
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

            return { ...answer, text: text || null, sent_params };
        },
    });

    return { ...result, candidate };
}
