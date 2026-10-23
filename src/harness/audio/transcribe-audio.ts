import { AppData } from "@/src/data/app-data";
import AppError from "@/src/utils/app-error";
import HarnessError from "../harness-error";
import grabHarnessAdapter from "../providers/grab-harness-adapter";
import resolveHarnessCandidates from "../resolve/resolve-harness-candidates";
import withCandidates from "../resolve/with-candidates";
import type { HarnessAudioInput, HarnessUsage } from "../types";
import buildUsageCall from "../usage/build-usage-call";
import recordHarnessUsage from "../usage/record-harness-usage";

type Params = {
    audio: HarnessAudioInput;
    /**
     * ISO 639-1 code, when known. Helps speech-to-text models.
     */
    language?: string;
    signal?: AbortSignal;
    /**
     * Uses this bot's transcription model when it has its own.
     */
    bot_id?: number | string;
    /**
     * The workspace the call is in: its models win over the bot's.
     */
    workspace_id?: number | string | null;
};

/**
 * Turns speech into text with the transcription harness: its
 * speech-to-text model gets the file at `/audio/transcriptions`.
 */
export default async function transcribeAudio({
    audio,
    language,
    signal,
    bot_id,
    workspace_id,
}: Params) {
    if (audio.data.byteLength > AppData.HarnessMaxAudioBytes) {
        throw new AppError(`That recording is too long to transcribe.`);
    }

    const candidates = await resolveHarnessCandidates({
        harness: "transcription",
        bot_id,
        workspace_id,
    });

    const final_signal = signal || new AbortController().signal;

    const { result } = await withCandidates<{ text: string; usage?: HarnessUsage }>({
        harness: "transcription",
        candidates,
        on_success: async ({ candidate, result: transcript }): Promise<void> =>
            await recordHarnessUsage({
                call: buildUsageCall({
                    harness: "transcription",
                    candidate,
                    usage: transcript.usage,
                }),
            }),
        run: async (candidate) => {
            const adapter = grabHarnessAdapter({
                kind: candidate.provider.kind,
            });

            const { text, usage } = await adapter.transcribe({
                candidate,
                audio,
                language,
                signal: final_signal,
            });

            if (text === null || text === undefined) {
                throw new HarnessError({
                    message: `The model returned no transcript.`,
                    retryable: true,
                    candidate_key: candidate.key,
                });
            }

            return { text: text.trim(), usage };
        },
    });

    return result.text;
}
