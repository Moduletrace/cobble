type Params = {
    text: string | null | undefined;
    /**
     * How much of it is kept (`AppData.BotTrace*MaxChars`). A trace is
     * read, not replayed, so the start is enough.
     */
    max: number;
    /**
     * Kept whole even when it sits past `max`: a tool call's path, which is
     * what the reader needs to know which file the call touched. Ignored
     * when the text does not contain it.
     */
    keep?: string | null;
};

/**
 * One field of a trace, cut to what the debug view keeps of it. Null when
 * there's nothing to keep.
 */
export default function capTraceText({ text, max, keep }: Params): string | null {
    if (!text) return null;

    if (text.length <= max) return text;

    const cut = (room: number) => `\n[cut: ${text.length - room} more characters not kept]`;

    const anchor = keep && keep.length < max && text.includes(keep) ? `\n[kept in full: ${keep}]` : null;

    if (!anchor) return `${text.slice(0, max)}${cut(max)}`;

    /**
     * The head has to leave room for both notes, and the cut note's own
     * length depends on how much was cut: two passes settle it.
     */
    let head = Math.max(0, max - anchor.length - cut(0).length);

    for (let pass = 0; pass < 2; pass++) {
        head = Math.max(0, max - anchor.length - cut(head).length);
    }

    return `${text.slice(0, head)}${cut(head)}${anchor}`;
}