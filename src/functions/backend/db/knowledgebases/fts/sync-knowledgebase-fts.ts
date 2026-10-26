import BunSQLite from "@moduletrace/bun-sqlite";
import ensureKnowledgebaseFts from "./ensure-knowledgebase-fts";

/**
 * Brings the full-text index in line with `knowledgebase_chunks`, at boot:
 * adds passages it doesn't have (stored before it existed, or by a process
 * that failed halfway) and drops ones whose passage is gone (a delete from
 * a script). Returns how many rows it added and dropped.
 */
export default async function syncKnowledgebaseFts() {
    await ensureKnowledgebaseFts();

    /**
     * Counted here: FTS5 reports its own shadow-table writes as changes.
     */
    const count = async () =>
        Number(
            (await BunSQLite.sql<{ n: number }>({ sql: `SELECT COUNT(*) AS n FROM knowledgebase_chunks_fts` }))
                .payload?.[0]?.n,
        ) || 0;

    const start = await count();

    const added = await BunSQLite.sql({
        sql: `INSERT INTO knowledgebase_chunks_fts (text, chunk_id, document_id, knowledgebase_id)
            SELECT c.text, c.id, c.document_id, c.knowledgebase_id FROM knowledgebase_chunks c
            WHERE c.id NOT IN (SELECT chunk_id FROM knowledgebase_chunks_fts)`,
    });

    const after_add = await count();

    const dropped = await BunSQLite.sql({
        sql: `DELETE FROM knowledgebase_chunks_fts WHERE chunk_id NOT IN (SELECT id FROM knowledgebase_chunks)`,
    });

    if (!added.success || !dropped.success) {
        throw new Error(`Couldn't sync the knowledgebase search index: ${added.error || dropped.error}`);
    }

    return { added: after_add - start, dropped: after_add - (await count()) };
}
