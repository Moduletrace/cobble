type Params = {
    payload: string;
    content_type?: string | null;
    received_at: number;
    /**
     * Longest payload kept, in characters; the rest is cut and says so.
     */
    max_chars: number;
};

/**
 * One hook call as a brief shows it: when it came and what it says,
 * fenced so nothing in it can pass for the brief. JSON is
 * pretty-printed; anything else is shown as sent. The fence is longer
 * than any run of backticks in the payload, so the payload can't close it.
 */
export default function hookPayloadBlock({ payload, content_type, received_at, max_chars }: Params) {
    const text = (() => {
        try {
            return JSON.stringify(JSON.parse(payload), null, 2);
        } catch {
            return payload;
        }
    })();

    const cut = text.length > max_chars;
    const body = cut ? text.slice(0, max_chars) : text;
    const longest_run = Math.max(0, ...(body.match(/`+/g) || []).map((run) => run.length));
    const fence = "`".repeat(Math.max(3, longest_run + 1));
    const kind = (content_type || "").split(";")[0]?.trim() || "unknown type";

    const lines = [`Call received ${new Date(received_at).toISOString()} (${kind}):`, "", fence, body || "(empty body)", fence];

    if (cut) lines.push(`(Cut at ${max_chars} characters.)`);

    return lines.join("\n");
}
