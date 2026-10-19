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

    return { text: String(json?.text || "").trim() };
};

export default transcribe;
