type Params = {
    /**
     * Keyed by the field sent on the wire (`grabChatParams`).
     */
    params?: Record<string, number | string | { effort: string }> | null;
};

/**
 * The generation settings a call sent, keyed by their setting
 * (`HarnessParameters`) rather than the wire: OpenRouter's nested
 * `reasoning: { effort }` reads back as `reasoning_effort`. Empty fields
 * are left out; undefined when nothing was sent.
 */
export default function flattenSentParams({ params }: Params) {
    const flat: Record<string, number | string> = {};

    for (const [key, value] of Object.entries(params || {})) {
        if (value && typeof value == "object") {
            if (value.effort) flat[key == "reasoning" ? "reasoning_effort" : key] = String(value.effort);
        } else if (typeof value == "number" || (typeof value == "string" && value)) {
            flat[key] = value;
        }
    }

    return Object.keys(flat).length ? flat : undefined;
}
