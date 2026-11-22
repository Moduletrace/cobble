import previewResult from "./preview-result";

type Params = {
    text: string;
    /**
     * The same call over the provider's REST API, which answers with the whole
     * result its MCP router cut. Left out when the text already came from
     * REST, or when there is nothing left to ask.
     */
    retry?: () => Promise<unknown>;
};

/**
 * A provider's preview replaced by the whole result when the provider can
 * still give it, and by an honest account of what is missing when it can't.
 *
 * A retry runs only for an answer that was cut, and costs one more action of
 * the same tool, so most answers pay nothing.
 */
export default async function expandPreviewResult({ text, retry }: Params): Promise<string> {
    const seen = previewResult({ text });

    if (!seen.preview) return text;

    if (retry) {
        try {
            const full = await retry();

            if (full != null) {
                const whole = typeof full == "string" ? full : JSON.stringify(full, null, 2);
                const again = previewResult({ text: whole });

                return again.preview ? again.text : whole;
            }
        } catch {
            // Best effort: the preview's own note still says what is missing.
        }
    }

    return seen.text;
}