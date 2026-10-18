type Params = {
    text?: string | null;
};

/**
 * Reads a job's `params` or `checkpoint` column. Null when empty or not a
 * JSON object.
 */
export default function parseJobJson({
    text,
}: Params): Record<string, unknown> | null {
    if (!text) return null;

    try {
        const value = JSON.parse(text);
        return value && typeof value == "object" && !Array.isArray(value)
            ? value
            : null;
    } catch {
        return null;
    }
}
