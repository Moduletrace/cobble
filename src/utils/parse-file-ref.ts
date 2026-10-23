type Params = {
    /**
     * A file ref as a bot writes it (`[file:12]`), an id as text (`"12"`),
     * or a number.
     */
    ref?: string | number | null;
};

/**
 * The file id a `[file:ID]` ref names, so a tool can take the ref a bot
 * copied out of `list_files` instead of asking it for a bare number.
 * Null when it names nothing usable.
 */
export default function parseFileRef({ ref }: Params): number | null {
    if (typeof ref == "number") return Number.isInteger(ref) && ref > 0 ? ref : null;

    if (typeof ref != "string") return null;

    const text = ref.trim();

    if (!text) return null;

    const marked = text.match(/^\[file:\s*(\d+)\s*\]$/i)?.[1];
    const bare = marked || (/^\d+$/.test(text) ? text : "");

    if (!bare) return null;

    const id = Number(bare);

    return Number.isInteger(id) && id > 0 ? id : null;
}
