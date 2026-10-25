import { ReadImagePrompt } from "@/src/data/harness-prompts";
import HarnessError from "../harness-error";
import grabHarnessAdapter from "../providers/grab-harness-adapter";
import resolveHarnessCandidates from "../resolve/resolve-harness-candidates";
import withCandidates from "../resolve/with-candidates";
import type { HarnessUsage } from "../types";
import grabChatParams from "../text/grab-chat-params";
import flattenSentParams from "../usage/flatten-sent-params";
import buildUsageCall from "../usage/build-usage-call";
import recordHarnessUsage from "../usage/record-harness-usage";

type Params = {
    /**
     * An https or `data:` URL.
     */
    url: string;
    /**
     * What to look for, added to the standard reading prompt.
     */
    focus?: string;
    signal?: AbortSignal;
    /**
     * Uses this bot's media reading model when it has its own.
     */
    bot_id?: number | string;
    /**
     * The workspace the call is in: its models win over the bot's.
     */
    workspace_id?: number | string | null;
};

/**
 * Reads an image with the media reading (vision) harness and returns what
 * it sees, as text for a model that can't see.
 */
export default async function readImage({ url, focus, signal, bot_id, workspace_id }: Params) {
    const candidates = await resolveHarnessCandidates({
        harness: "vision",
        bot_id,
        workspace_id,
    });

    const saved_params = await grabChatParams({
        harness: "vision",
        bot_id,
        workspace_id,
    });

    const { result } = await withCandidates<{
        text: string;
        usage?: HarnessUsage;
        sent_params: Record<string, number | string | { effort: string }>;
    }>({
        harness: "vision",
        candidates,
        on_success: async ({ candidate, result: answer, failed }): Promise<void> =>
            await recordHarnessUsage({
                call: buildUsageCall({
                    harness: "vision",
                    candidate,
                    usage: answer.usage,
                    failed,
                    settings: {
                        settings_source: saved_params.source,
                        params: flattenSentParams({ params: answer.sent_params }),
                    },
                }),
            }),
        run: async (candidate) => {
            /**
             * Reading is a lookup, so it stays literal unless a
             * temperature was set for the vision harness.
             */
            const sent_params = {
                temperature: 0,
                ...saved_params.paramsFor(candidate.model),
            };
            const answer = await grabHarnessAdapter({
                kind: candidate.provider.kind,
            }).chat({
                candidate,
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: focus
                                    ? `${ReadImagePrompt}\n\nPay special attention to: ${focus}`
                                    : ReadImagePrompt,
                            },
                            { type: "image", url },
                        ],
                    },
                ],
                params: sent_params,
                signal: signal || new AbortController().signal,
            });

            if (!answer.text?.trim()) {
                throw new HarnessError({
                    message: `The model couldn't read the image.`,
                    retryable: true,
                    candidate_key: candidate.key,
                });
            }

            return { text: answer.text.trim(), usage: answer.usage, sent_params };
        },
    });

    return result.text;
}
