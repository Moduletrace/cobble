/**
 * The path a tool call's arguments name, if they name one.
 *
 * The debug view cuts a tool call's arguments to
 * `AppData.BotTraceArgumentsMaxChars`, and a write's arguments are mostly
 * content: the path, which is the one thing a reader needs to know what the
 * call touched, sits at the front of a `write_file` and can be past 2,000
 * characters in a `computer_edit_file` whose `old_text` comes first.
 * `capTraceText` is handed this so the path survives the cut.
 *
 * Framework-free and forgiving: arguments that are not a JSON object simply
 * have no path.
 */

/** Keys a tool in this app uses for the file it acts on. */
const PathKeys = ["path", "file_path", "absolute_path", "target_file"];

export default function toolArgumentPath({ text }: { text: string | null | undefined }): string | null {
    if (!text) return null;

    let parsed: unknown;

    try {
        parsed = JSON.parse(text);
    } catch {
        return null;
    }

    if (!parsed || typeof parsed != "object" || Array.isArray(parsed)) return null;

    for (const key of PathKeys) {
        const value = (parsed as Record<string, unknown>)[key];

        if (typeof value == "string" && value.trim()) return value;
    }

    return null;
}