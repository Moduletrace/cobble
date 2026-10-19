type Params<T> = {
    text?: string | null;
    fallback: T;
};

/**
 * Reads a JSON column of an MCP server or custom tool. The fallback when
 * it's empty, not JSON, or not the same shape (array or object).
 */
export default function parseJsonColumn<T extends object>({ text, fallback }: Params<T>): T {
    if (!text) return fallback;

    try {
        const value = JSON.parse(text);

        if (!value || typeof value != "object") return fallback;
        if (Array.isArray(value) != Array.isArray(fallback)) return fallback;

        return value as T;
    } catch {
        return fallback;
    }
}
