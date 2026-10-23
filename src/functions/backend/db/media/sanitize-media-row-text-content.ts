import type { BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import capTextContent from "@/src/utils/cap-text-content";
import decideTextContent from "@/src/utils/decide-text-content";

type Params = {
    /**
     * The row as the request sent it.
     */
    row: Partial<BUN_SQLITE_COBBLE_MEDIA>;
    /**
     * The row already in the database, for an update: its name and type
     * decide whether the new text may be kept when the update doesn't
     * repeat them.
     */
    existing?: Partial<BUN_SQLITE_COBBLE_MEDIA> | null;
};

/**
 * A `media` row whose `text_content` is what the column may hold.
 *
 * The upload path decides this itself, but the CRUD API writes rows
 * straight through, so a typed-in `text_content` could store raw bytes or
 * megabytes of text. An update that carries no text is left alone.
 */
export default function sanitizeMediaRowTextContent({
    row,
    existing,
}: Params): Partial<BUN_SQLITE_COBBLE_MEDIA> {
    const text = row.text_content;

    if (text === undefined) return row;

    const name = row.title || existing?.title || null;
    const mime_type = row.mime_type || existing?.mime_type || null;

    /**
     * With no name and no type there is nothing to judge it by, so it is
     * only cut: dropping text that a rename would have kept would be
     * worse than a slightly generous cache.
     */
    const text_content =
        name || mime_type
            ? decideTextContent({ name, mime_type, text })
            : text
              ? capTextContent({ text })
              : null;

    return { ...row, text_content: text_content ?? undefined };
}
