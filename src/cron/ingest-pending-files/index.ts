import BunSQLite from "@moduletrace/bun-sqlite";
import enqueueDocumentIngest from "@/src/file-ingest/enqueue-document-ingest";

/**
 * Queues any knowledgebase document that never got ingested (an upload
 * that happened while the worker was down, a restart mid-ingest), so
 * nothing is left unsearchable. Runs every ten minutes.
 */
export default async function ingestPendingFiles() {
    const documents = await BunSQLite.sql<{ id: number }>({
        sql: `SELECT d.id FROM knowledgebase_documents d
            WHERE d.ingested_at IS NULL
              AND d.ingest_error IS NULL
              AND NOT EXISTS (
                  SELECT 1 FROM file_ingest_queue q
                  WHERE q.document_id = d.id AND q.status IN ('pending', 'processing')
              )
            LIMIT 25`,
    });

    for (const document of documents.payload || []) {
        if (document.id) await enqueueDocumentIngest({ document_id: document.id });
    }

    return documents.payload?.length || 0;
}
