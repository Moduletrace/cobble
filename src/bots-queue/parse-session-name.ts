type Params = {
    text?: string | null;
};

export type SessionName = {
    title: string;
    summary: string;
};

/**
 * Reads the JSON a naming model answers with: its title and summary.
 * Tolerates a surrounding code fence or a sentence around the object.
 * Null when either is missing.
 */
export default function parseSessionName({ text }: Params): SessionName | null {
    if (!text) return null;

    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");

    if (start < 0 || end <= start) return null;

    try {
        const value = JSON.parse(text.slice(start, end + 1));

        if (!value || typeof value != "object" || Array.isArray(value)) return null;

        const title = typeof value.title == "string" ? value.title.trim() : "";
        const summary = typeof value.summary == "string" ? value.summary.trim() : "";

        return title && summary ? { title, summary } : null;
    } catch {
        return null;
    }
}
