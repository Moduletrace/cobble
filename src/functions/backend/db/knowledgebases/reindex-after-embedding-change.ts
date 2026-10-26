import BunSQLite from "@moduletrace/bun-sqlite";
import enqueueDocumentIngest from "@/src/file-ingest/enqueue-document-ingest";
import grabInstallEmbeddingModel from "./grab-install-embedding-model";

type Params = {
    /**
     * The install's embedding model before the change
     * (`grabInstallEmbeddingModel`), null when there was none.
     */
    before: string | null;
};

/**
 * After something that can change the install's embedding model (its
 * setting, a provider, the catalog), queues every knowledgebase document
 * that was read with another model, or by words only, to be read again:
 * a query embedded by the new model can't be compared with vectors from
 * the old one. Nothing happens when the model is the same, or there's
 * none. Returns how many documents were queued.
 */
export default async function reindexAfterEmbeddingChange({ before }: Params) {
    const after = await grabInstallEmbeddingModel();

    if (!after || after == before) return 0;

    const documents = await BunSQLite.sql<{ id: number }>({
        sql: `SELECT id FROM knowledgebase_documents
            WHERE ingested_at IS NOT NULL AND chunk_count > 0
              AND (embedding_model IS NULL OR embedding_model != ?)`,
        values: [after],
    });

    for (const document of documents.payload || []) {
        await enqueueDocumentIngest({ document_id: document.id });
    }

    return documents.payload?.length || 0;
}
