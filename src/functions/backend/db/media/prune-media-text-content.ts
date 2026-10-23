import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_MEDIA } from "@/db/types/db";
import planTextContentPrune, { type TextContentChange } from "./plan-text-content-prune";

/**
 * One statement against the database. `BunSQLite.sql` is the real one; a
 * test passes its own, so the whole sweep can be run without the app's
 * database.
 */
export type SqlRunner = (params: {
    sql: string;
    values?: (string | number | null)[];
}) => Promise<{ payload?: unknown[] | null }>;

export type PruneMediaTextResult = {
    checked: number;
    cleared: number;
    truncated: number;
    reclaimed_bytes: number;
    changes: TextContentChange[];
};

type Params = {
    run?: SqlRunner;
    /**
     * When the sweep runs, for the rows it writes.
     */
    now?: number;
};

/**
 * Brings every `media.text_content` in line with what may be stored there
 * (`planTextContentPrune`): no text on a type the extractor can't read,
 * and no text longer than the store ceiling.
 *
 * Run once per install after the allowlist landed; safe to rerun, since a
 * row that is already right is not written.
 */
export default async function pruneMediaTextContent({
    run,
    now = Date.now(),
}: Params = {}): Promise<PruneMediaTextResult> {
    const sql: SqlRunner =
        run || (({ sql, values }) => BunSQLite.sql<BUN_SQLITE_COBBLE_MEDIA>({ sql, values }));

    const res = await sql({
        sql: `SELECT id, title, mime_type, media_type, text_content
            FROM media
            WHERE text_content IS NOT NULL AND TRIM(text_content) != ''`,
    });

    const rows = (res.payload || []) as BUN_SQLITE_COBBLE_MEDIA[];
    const changes = planTextContentPrune({ rows });
    const result: PruneMediaTextResult = {
        checked: rows.length,
        cleared: 0,
        truncated: 0,
        reclaimed_bytes: 0,
        changes,
    };

    for (const change of changes) {
        await sql({
            sql: `UPDATE media SET text_content = ?, updated_at = ? WHERE id = ?`,
            values: [change.text_content, now, change.media_id],
        });

        result.reclaimed_bytes += change.before_chars - change.after_chars;

        if (change.text_content === null) result.cleared += 1;
        else result.truncated += 1;
    }

    return result;
}
