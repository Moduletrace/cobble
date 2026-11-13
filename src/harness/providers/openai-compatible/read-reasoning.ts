type Params = {
    /**
     * A chat completion's `message`.
     */
    message: any;
};

/**
 * What a reasoning model thought before it answered, when its provider
 * hands it back. The spellings in the wild: `reasoning` (OpenRouter, as a
 * string or a list of parts), `reasoning_content` (DeepSeek and the
 * providers that copied it), and `reasoning_details` (OpenRouter's list of
 * encrypted or summarised details, whose `text` or `summary` is readable).
 * Null when there's nothing readable.
 */
export default function readReasoning({ message }: Params): string | null {
    const candidates: unknown[] = [message?.reasoning, message?.reasoning_content];

    if (Array.isArray(message?.reasoning_details)) {
        for (const detail of message.reasoning_details) candidates.push(detail?.text, detail?.summary);
    }

    for (const candidate of candidates) {
        const text =
            typeof candidate == "string"
                ? candidate
                : Array.isArray(candidate)
                  ? candidate
                        .map((part: any) =>
                            typeof part == "string" ? part : typeof part?.text == "string" ? part.text : "",
                        )
                        .join("")
                  : "";

        if (text.trim()) return text.trim();
    }

    return null;
}