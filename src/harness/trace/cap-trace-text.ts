type Params = {
    text: string | null | undefined;
    /**
     * How much of it is kept (`AppData.BotTrace*MaxChars`). A trace is
     * read, not replayed, so the start is enough.
     */
    max: number;
};

/**
 * One field of a trace, cut to what the debug view keeps of it. Null when
 * there's nothing to keep.
 */
export default function capTraceText({ text, max }: Params): string | null {
    if (!text) return null;

    if (text.length <= max) return text;

    return `${text.slice(0, max)}\n[cut: ${text.length - max} more characters not kept]`;
}