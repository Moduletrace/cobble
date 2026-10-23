import HarnessError from "../../harness-error";
import type { HarnessAdapter } from "../../types";
import providerRequest from "./provider-request";

/**
 * `POST /audio/transcriptions` as an OpenAI-style file upload, which
 * OpenRouter, OpenAI, Groq and local servers all take.
 */
const transcribe: HarnessAdapter["transcribe"] = async ({
    candidate,
    audio,
    language,
    signal,
}) => {
    const form = new FormData();

    form.append("model", candidate.model.slug);
    form.append(
        "file",
        new Blob([new Uint8Array(audio.data)], {
            type: `audio/${audio.format}`,
        }),
        `audio.${audio.format}`,
    );

    if (language) {
        form.append("language", language);
    }

    const res = await providerRequest({
        provider: candidate.provider,
        path: "/audio/transcriptions",
        form,
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
            message: `${candidate.provider.name || "The provider"} returned an unreadable transcript.`,
            retryable: true,
            candidate_key: candidate.key,
        });
    }

    /**
     * Providers that bill by audio seconds sometimes report a token count;
     * the OpenAI shape puts it under `usage`. Left out when absent, so the
     * row records that the call happened without a token count.
     */
    const usage =
        json?.usage && typeof json.usage == "object"
            ? {
                  prompt_tokens: Number(json.usage.prompt_tokens ?? json.usage.input_tokens) || 0,
                  completion_tokens:
                      Number(json.usage.completion_tokens ?? json.usage.output_tokens) || 0,
                  ...(typeof json.usage.cost == "number" ? { cost: json.usage.cost } : {}),
              }
            : undefined;

    return { text: String(json?.text || "").trim(), ...(usage ? { usage } : {}) };
};

export default transcribe;
