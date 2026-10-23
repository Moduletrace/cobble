import formatBytes from "@/src/utils/format-bytes";
import type { DatabaseCell } from "@/src/types";

type Params = {
    /**
     * The value read out of SQLite, already cut to the length asked for.
     */
    value: unknown;
    /**
     * SQLite's own type for the stored value: `integer`, `real`, `text`,
     * `blob` or `null`.
     */
    type: string;
    /**
     * How long the stored value is (characters for text, bytes for a
     * blob), which says whether `value` is the whole of it.
     */
    length: number;
    max_chars: number;
};

/**
 * One stored value as a cell shows it. Text is cut at `max_chars` and
 * marked truncated, a blob is only its size (its bytes would fill the page
 * with noise), a number is printed as it is, and NULL is said, never left
 * blank.
 */
export default function toDatabaseCell({ value, type, length, max_chars }: Params): DatabaseCell {
    if (type == "null" || value === null || value === undefined) {
        return { text: "", kind: "null", truncated: false };
    }

    if (type == "blob") {
        return {
            text: `<${formatBytes({ bytes: length })} of binary data>`,
            kind: "blob",
            truncated: false,
        };
    }

    const text = String(value);

    if (type == "integer" || type == "real") {
        return { text, kind: "number", truncated: false };
    }

    return { text, kind: "text", truncated: length > max_chars };
}
