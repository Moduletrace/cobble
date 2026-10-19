import { AppData } from "@/src/data/app-data";
import { TranscribeAudioPrompt } from "@/src/data/harness-prompts";
import AppError from "@/src/utils/app-error";
import HarnessError from "../harness-error";
import grabHarnessAdapter from "../providers/grab-harness-adapter";
import resolveHarnessCandidates from "../resolve/resolve-harness-candidates";
import withCandidates from "../resolve/with-candidates";
import type { HarnessAudioInput } from "../types";
import looksLikeMissingAudio from "./looks-like-missing-audio";

/**
 * A chat model that drops audio is skipped this long.
 */
const MissingAudioCooldownMs = 60 * 60 * 1000;

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
};

/**
 * Turns speech into text with the transcription harness. Speech-to-text
 * models get the file at `/audio/transcriptions`; chat models that hear
 * audio are asked for a verbatim transcript.
 */
export default async function transcribeAudio({
    audio,
    language,
    signal,
    bot_id,
}: Params) {
    if (audio.data.byteLength > AppData.HarnessMaxAudioBytes) {
        throw new AppError(`That recording is too long to transcribe.`);
    }

    const candidates = await resolveHarnessCandidates({
        harness: "transcription",
        bot_id,
    });

    const final_signal = signal || new AbortController().signal;

    const { result } = await withCandidates({
        harness: "transcription",
        candidates,
        run: async (candidate) => {
            const adapter = grabHarnessAdapter({
                kind: candidate.provider.kind,
            });

            const is_speech_to_text =
                candidate.model.output_modalities.includes("transcription");

            const text = is_speech_to_text
                ? (
                      await adapter.transcribe({
                          candidate,
                          audio,
                          language,
                          signal: final_signal,
                      })
                  ).text
                : (
                      await adapter.chat({
                          candidate,
                          messages: [
                              {
                                  role: "user",
                                  content: [
                                      { type: "text", text: TranscribeAudioPrompt },
                                      {
                                          type: "audio",
                                          data: Buffer.from(audio.data).toString(
                                              "base64",
                                          ),
                                          format: audio.format,
                                      },
                                  ],
                              },
                          ],
                          temperature: 0,
                          signal: final_signal,
                      })
                  ).text;

            if (text === null || text === undefined) {
                throw new HarnessError({
                    message: `The model returned no transcript.`,
                    retryable: true,
                    candidate_key: candidate.key,
                });
            }

            if (!is_speech_to_text && looksLikeMissingAudio({ text })) {
                throw new HarnessError({
                    message: `${candidate.model.name || candidate.model.slug} didn't get the audio.`,
                    retryable: true,
                    retry_at: Date.now() + MissingAudioCooldownMs,
                    candidate_key: candidate.key,
                });
            }

            return text.trim();
        },
    });

    return result;
}
