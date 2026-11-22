import HarnessError from "../../harness-error";
import type { HarnessCandidate } from "../../types";
import { dashScopeOrigin, NativeGenerationPath } from "./dashscope-hosts";
import providerRequest from "./provider-request";

type Params = {
    candidate: HarnessCandidate;
    audio: { data: Uint8Array; format: string };
    language?: string;
    signal: AbortSignal;
};

/**
 * What the audio formats the browser records are called as MIME types.
 * DashScope takes a data URL, and Safari's `audio/mp4` recording arrives
 * here as `m4a`, which no browser spells as a MIME type.
 */
const AudioMimeTypes: Record<string, string> = {
    m4a: "audio/mp4",
    mp4: "audio/mp4",
    mp3: "audio/mpeg",
    ogg: "audio/ogg",
    opus: "audio/ogg",
};

/**
 * Qwen-ASR on Alibaba's native multimodal route. The Token Plan host and the
 * workspace Model Studio hosts have no `/audio/transcriptions` at all: the
 * model is asked on the host root (beside `compatible-mode/v1`) with the
 * audio inline as a data URL, and answers its transcript at `output.text`.
 *
 * The formats Alibaba documents are wav, mp3 and opus, but live calls take
 * every format the recorders here produce (webm, m4a, ogg) when the label
 * matches the bytes, so the browser's own recording is sent as it is rather
 * than re-encoded first.
 */
export default async function transcribeNative({
    candidate,
    audio,
    language,
    signal,
}: Params): Promise<{ text: string }> {
    const { provider, model } = candidate;
    const name = provider.name || "Alibaba Cloud";
    const format = audio.format.toLowerCase();
    const mime_type = AudioMimeTypes[format] || `audio/${format}`;
    const data_url = `data:${mime_type};base64,${Buffer.from(audio.data).toString("base64")}`;
    const hint = languageHint({ language });

    const res = await providerRequest({
        provider,
        base_url: dashScopeOrigin({ base_url: provider.base_url }),
        path: NativeGenerationPath,
        json: {
            model: model.slug,
            input: {
                messages: [
                    {
                        role: "user",
                        content: [{ type: "input_audio", input_audio: { data: data_url } }],
                    },
                ],
            },
            parameters: {
                format,
                ...(hint ? { language_hints: [hint] } : {}),
            },
        },
        signal,
        candidate_key: candidate.key,
    });

    const json = await res.json().catch(() => null);

    /**
     * A cut-off or malformed answer is a failed call, not silence: saying
     * it failed lets the harness try the next model instead of handing the
     * user an empty transcript.
     */
    if (json === null) {
        throw new HarnessError({
            message: `${name} returned an unreadable transcript.`,
            retryable: true,
            candidate_key: candidate.key,
        });
    }

    const text = String(json?.output?.text ?? json?.text ?? "").trim();

    if (!text) {
        throw new HarnessError({
            message: `${name} returned an empty transcript.`,
            retryable: true,
            candidate_key: candidate.key,
        });
    }

    return { text };
}

/**
 * `language_hints` takes a language (`en`), not a locale (`en-US`), so the
 * browser's BCP-47 tag is cut to its primary subtag.
 */
function languageHint({ language }: { language?: string }) {
    const primary = language?.trim().split(/[-_]/)[0]?.toLowerCase() ?? "";

    return /^[a-z]{2,3}$/.test(primary) ? primary : undefined;
}