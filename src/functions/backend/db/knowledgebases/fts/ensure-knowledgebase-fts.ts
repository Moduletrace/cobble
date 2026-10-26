import BunSQLite from "@moduletrace/bun-sqlite";

let ensured: Promise<void> | undefined;

/**
 * Makes sure the full-text index of knowledgebase passages exists, once
 * per process. An FTS5 table can't be declared in `db/schema.ts`, so it is
 * made here; schema sync only drops tables it made, so it leaves this one
 * alone. `unicode61 remove_diacritics 2` matches words in any script that
 * separates them with spaces, accents or not ("conges" finds "congés").
 */
export default function ensureKnowledgebaseFts() {
    ensured ||= create().catch((error) => {
        ensured = undefined;
        throw error;
    });

    return ensured;
}

async function create() {
    const res = await BunSQLite.sql({
        sql: `CREATE VIRTUAL TABLE IF NOT EXISTS knowledgebase_chunks_fts USING fts5(
            text,
            chunk_id UNINDEXED,
            document_id UNINDEXED,
            knowledgebase_id UNINDEXED,
            tokenize = 'unicode61 remove_diacritics 2'
        )`,
    });

    if (!res.success) throw new Error(`Couldn't make the knowledgebase search index: ${res.error || res.msg}`);
}
