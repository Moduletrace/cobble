import { ReadImagePrompt } from "@/src/data/harness-prompts";
import HarnessError from "../harness-error";
import grabHarnessAdapter from "../providers/grab-harness-adapter";
import resolveHarnessCandidates from "../resolve/resolve-harness-candidates";
import withCandidates from "../resolve/with-candidates";

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

    const { result } = await withCandidates({
        harness: "vision",
        candidates,
        run: async (candidate) => {
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
                temperature: 0,
                signal: signal || new AbortController().signal,
            });

            if (!answer.text?.trim()) {
                throw new HarnessError({
                    message: `The model couldn't read the image.`,
                    retryable: true,
                    candidate_key: candidate.key,
                });
            }

            return answer.text.trim();
        },
    });

    return result;
}
