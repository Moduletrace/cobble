type Params = {
    name: string;
    /**
     * Every name of this kind already here, so the copy gets one nobody has.
     */
    taken: string[];
    /**
     * How the marker reads: `Name (imported)`, `name_imported` or
     * `name-imported`.
     */
    style: "words" | "snake" | "dash";
    /**
     * What the name can't pass, e.g. a slug's 64 characters: the base is
     * cut to make room for the marker.
     */
    max_length?: number;
};

/**
 * A name for a copy of an imported item, so it can sit beside the row it
 * would otherwise replace.
 */
export default function uniqueCopyName({ name, taken, style, max_length = 200 }: Params): string {
    for (let n = 1; n < 100; n++) {
        const marker = n == 1 ? "" : ` ${n}`;
        const suffix =
            style == "words" ? ` (imported${marker})` : style == "snake" ? `_imported${n == 1 ? "" : `_${n}`}` : `-imported${n == 1 ? "" : `-${n}`}`;
        const base = name.slice(0, Math.max(1, max_length - suffix.length));
        const copy = `${base}${suffix}`;

        if (!taken.includes(copy)) return copy;
    }

    return `${name.slice(0, Math.max(1, max_length - 11))}-imported-x`;
}