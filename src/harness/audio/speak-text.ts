import grabHarnessSetting from "@/src/functions/backend/db/harness/grab-harness-setting";
import grabHarnessAdapter from "../providers/grab-harness-adapter";
import resolveHarnessCandidates from "../resolve/resolve-harness-candidates";
import withCandidates from "../resolve/with-candidates";
import type { HarnessAudioStream, HarnessCandidate } from "../types";
import buildUsageCall from "../usage/build-usage-call";
import recordHarnessUsage from "../usage/record-harness-usage";

type Params = {
    text: string;
    /**
     * `mp3` unless set.
     */
    format?: string;
    signal?: AbortSignal;
    /**
     * Uses this bot's speech model and voice when it has its own.
     */
    bot_id?: number | string;
    /**
     * The workspace the call is in: its models win over the bot's.
     */
    workspace_id?: number | string | null;
};

/**
 * Reads text aloud with the speech harness, as a stream that can play
 * while the rest is still being made. Falls back to the next model only
 * until one answers. Uses the voice picked in the speech setting when the
 * model has it, else the model's first voice.
 */
export default async function speakText({
    text,
    format,
    signal,
    bot_id,
    workspace_id,
}: Params) {
    const [candidates, setting] = await Promise.all([
        resolveHarnessCandidates({ harness: "speech", bot_id, workspace_id }),
        grabHarnessSetting({ harness: "speech", bot_id, workspace_id }),
    ]);

    const { result } = await withCandidates<HarnessAudioStream>({
        harness: "speech",
        candidates,
        /**
         * Speech is billed per character and streamed, so there is no
         * completion count to read: the call is recorded as it is, with
         * the text's length standing in for what was spoken.
         */
        on_success: async ({ candidate }) =>
            await recordHarnessUsage({
                call: buildUsageCall({
                    harness: "speech",
                    candidate,
                    usage: { prompt_tokens: text.length, completion_tokens: 0 },
                }),
            }),
        run: async (candidate) =>
            await grabHarnessAdapter({ kind: candidate.provider.kind }).speak({
                candidate,
                text,
                voice: pickVoice({
                    candidate,
                    voice:
                        typeof setting.options.voice == "string"
                            ? setting.options.voice
                            : undefined,
                }),
                format,
                signal: signal || new AbortController().signal,
            }),
    });

    return result;
}

/**
 * The voice to ask for: the picked one when the model has it (or the
 * model was picked by hand), else the model's first, else OpenAI's.
 */
export function pickVoice({
    candidate,
    voice,
}: {
    candidate: HarnessCandidate;
    voice?: string;
}) {
    const voices = candidate.model.voices;

    if (voice && (candidate.source == "pinned" || voices?.includes(voice))) {
        return voice;
    }

    if (voices?.[0]) return voices[0];

    return candidate.provider.kind == "openai" ? "alloy" : undefined;
}
