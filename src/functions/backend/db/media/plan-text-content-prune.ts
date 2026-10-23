import type { BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import decideTextContent from "@/src/utils/decide-text-content";

export type TextContentChange = {
    media_id: number;
    name: string;
    before_chars: number;
    after_chars: number;
    /**
     * What the row's `text_content` should become: `null` clears it.
     */
    text_content: string | null;
};

type Params = {
    /**
     * The `media` rows that have any `text_content`.
     */
    rows: Partial<BUN_SQLITE_COBBLE_MEDIA>[];
};

/**
 * What `pruneMediaTextContent` would change, worked out without touching
 * the database: one entry per row whose text belongs nowhere or is over
 * the store ceiling, and nothing at all for a row that is already right.
 */
export default function planTextContentPrune({ rows }: Params): TextContentChange[] {
    const changes: TextContentChange[] = [];

    for (const row of rows) {
        if (!row.id) continue;

        const before = row.text_content || "";

        if (!before.trim()) continue;

        const text_content = decideTextContent({
            name: row.title,
            mime_type: row.mime_type,
            text: before,
        });

        if (text_content === before) continue;

        changes.push({
            media_id: Number(row.id),
            name: row.title || "no name",
            before_chars: before.length,
            after_chars: text_content?.length || 0,
            text_content,
        });
    }

    return changes;
}
