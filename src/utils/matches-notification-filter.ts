type Params = {
    /**
     * The watcher's JSON (`origin`, `title`, `body`, `app`), as received.
     */
    payload: string;
    /**
     * Words to look for, any case; empty takes every notification. Several,
     * comma-separated, match when any one does.
     */
    filter?: string | null;
};

/**
 * Whether a browser notification is one a hook wants: its site, title, text
 * or app contains one of the filter's words. A payload that isn't the
 * watcher's JSON is searched as text.
 */
export default function matchesNotificationFilter({ payload, filter }: Params): boolean {
    const words = (filter || "")
        .split(",")
        .map((word) => word.trim().toLowerCase())
        .filter(Boolean);

    if (!words.length) return true;

    const text = (() => {
        try {
            const data = JSON.parse(payload);

            return [data?.origin, data?.title, data?.body, data?.app].filter((v) => typeof v == "string").join("\n");
        } catch {
            return payload;
        }
    })().toLowerCase();

    return words.some((word) => text.includes(word));
}
