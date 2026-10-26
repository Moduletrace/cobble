import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_FILES } from "@/db/types/db";
import enqueueDocumentIngest from "@/src/file-ingest/enqueue-document-ingest";
import enqueueFileIngest from "@/src/file-ingest/enqueue-file-ingest";

/**
 * Queues any bot file or knowledgebase document that never got ingested (an upload that happened
 * while the worker was down, a restart mid-ingest), so nothing is left
 * unsearchable. Runs every ten minutes.
 */
export default async function ingestPendingFiles() {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_FILES>({
        sql: `SELECT f.id FROM bot_files f
            WHERE f.ingested_at IS NULL
              AND f.ingest_error IS NULL
              AND f.created_at > ?
              AND NOT EXISTS (
                  SELECT 1 FROM file_ingest_queue q
                  WHERE q.file_id = f.id AND q.status IN ('pending', 'processing')
              )
            LIMIT 25`,
        values: [Date.now() - 24 * 60 * 60 * 1000],
    });

    for (const file of res.payload || []) {
        if (file.id) await enqueueFileIngest({ file_id: file.id });
    }

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

    return (res.payload?.length || 0) + (documents.payload?.length || 0);
}
