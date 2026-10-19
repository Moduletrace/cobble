import type { HarnessAdapter } from "../../types";
import HarnessError from "../../harness-error";
import providerRequest from "./provider-request";

/**
 * `POST /audio/speech`. Resolves once the provider answers, with its
 * audio as a stream (providers send it in chunks as it's made).
 */
const speak: HarnessAdapter["speak"] = async ({
    candidate,
    text,
    voice,
    format = "mp3",
    signal,
}) => {
    const res = await providerRequest({
        provider: candidate.provider,
        path: "/audio/speech",
        json: {
            model: candidate.model.slug,
            input: text,
            ...(voice ? { voice } : {}),
            response_format: format,
        },
        signal,
        candidate_key: candidate.key,
    });

    if (!res.body) {
        throw new HarnessError({
            message: `The model returned no audio.`,
            retryable: true,
            candidate_key: candidate.key,
        });
    }

    return {
        stream: res.body,
        media_type:
            res.headers.get("content-type")?.split(";")[0] ||
            `audio/${format == "mp3" ? "mpeg" : format}`,
    };
};

export default speak;
