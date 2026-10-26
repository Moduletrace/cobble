import BunSQLite from "@moduletrace/bun-sqlite";
import enqueueDocumentIngest from "@/src/file-ingest/enqueue-document-ingest";
import grabKnowledgebase from "./grab-knowledgebase";

type Params = {
    knowledgebase_id: number | string;
};

/**
 * Reads every document of a knowledgebase again (after the install's
 * embedding model changed, or one failed). Each keeps its old passages
 * until its new ones are in. Returns how many were queued.
 */
export default async function reindexKnowledgebase({ knowledgebase_id }: Params) {
    const knowledgebase = await grabKnowledgebase({ knowledgebase_id });

    const documents = await BunSQLite.sql<{ id: number }>({
        sql: `SELECT id FROM knowledgebase_documents WHERE knowledgebase_id = ?`,
        values: [knowledgebase.id],
    });

    await BunSQLite.sql({
        sql: `UPDATE knowledgebase_documents SET ingest_error = NULL WHERE knowledgebase_id = ?`,
        values: [knowledgebase.id],
    });

    for (const document of documents.payload || []) {
        await enqueueDocumentIngest({ document_id: document.id });
    }

    return documents.payload?.length || 0;
}
