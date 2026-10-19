import type { HarnessAdapter } from "../../types";
import providerRequest from "./provider-request";

/**
 * `POST /audio/speech`. Returns the audio bytes.
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

    return {
        data: new Uint8Array(await res.arrayBuffer()),
        media_type:
            res.headers.get("content-type")?.split(";")[0] ||
            `audio/${format == "mp3" ? "mpeg" : format}`,
    };
};

export default speak;
