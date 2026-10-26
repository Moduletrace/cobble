import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_KNOWLEDGEBASE_DOCUMENTS } from "@/db/types/db";
import type { KnowledgebaseDocumentsPayload } from "@/src/types";
import grabKnowledgebase from "./grab-knowledgebase";
import { KnowledgebaseDocumentIndexingSql } from "./knowledgebase-document-indexing-sql";
import parseKnowledgebaseDocumentRow from "./parse-knowledgebase-document-row";

type Params = {
    knowledgebase_id: number | string;
};

/**
 * A knowledgebase's documents, newest first, without their text.
 */
export default async function listKnowledgebaseDocuments({
    knowledgebase_id,
}: Params): Promise<KnowledgebaseDocumentsPayload> {
    const knowledgebase = await grabKnowledgebase({ knowledgebase_id });

    const rows = await BunSQLite.sql<BUN_SQLITE_COBBLE_KNOWLEDGEBASE_DOCUMENTS & { indexing?: number }>({
        sql: `SELECT id, knowledgebase_id, name, source, mime_type, size, chunk_count, embedding_model,
                ingested_at, ingest_error, created_at, ${KnowledgebaseDocumentIndexingSql} AS indexing
            FROM knowledgebase_documents d WHERE knowledgebase_id = ? ORDER BY id DESC`,
        values: [knowledgebase.id],
    });

    return {
        knowledgebase_id: knowledgebase.id,
        documents: (rows.payload || []).map((row) => parseKnowledgebaseDocumentRow({ row })),
    };
}
