import BunSQLite from "@moduletrace/bun-sqlite";
import enqueueDocumentIngest from "@/src/file-ingest/enqueue-document-ingest";
import grabKnowledgebase from "./grab-knowledgebase";

type Params = {
    knowledgebase_id: number | string;
    /**
     * One document. Left out, every document of the knowledgebase whose
     * last read failed.
     */
    document_id?: number | string;
};

/**
 * Queues the documents whose last read failed, and leaves the ones that
 * already succeeded. Clearing `ingest_error` lets `ingest-pending-files`
 * pick up one that was never read, if the queue write doesn't land.
 * Returns how many were queued.
 */
export default async function retryFailedDocuments({ knowledgebase_id, document_id }: Params) {
    const knowledgebase = await grabKnowledgebase({ knowledgebase_id });

    const documents = await BunSQLite.sql<{ id: number }>({
        sql: `SELECT id FROM knowledgebase_documents
            WHERE knowledgebase_id = ? AND ingest_error IS NOT NULL AND (? IS NULL OR id = ?)`,
        values: [knowledgebase.id, document_id ?? null, document_id ?? null],
    });

    const ids = (documents.payload || []).map((document) => document.id).filter(Boolean);

    if (!ids.length) return 0;

    await BunSQLite.sql({
        sql: `UPDATE knowledgebase_documents SET ingest_error = NULL, updated_at = ?
            WHERE knowledgebase_id = ? AND id IN (${ids.map(() => "?").join(", ")})`,
        values: [Date.now(), knowledgebase.id, ...ids],
    });

    for (const id of ids) {
        await enqueueDocumentIngest({ document_id: id });
    }

    return ids.length;
}
