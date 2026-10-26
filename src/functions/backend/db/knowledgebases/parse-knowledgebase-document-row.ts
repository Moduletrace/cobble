import type { BUN_SQLITE_COBBLE_KNOWLEDGEBASE_DOCUMENTS } from "@/db/types/db";
import type { KnowledgebaseDocument } from "@/src/types";

type Params = {
    /**
     * With `indexing` when the query asked (`KnowledgebaseDocumentIndexingSql`).
     */
    row: BUN_SQLITE_COBBLE_KNOWLEDGEBASE_DOCUMENTS & { indexing?: number | boolean };
};

/**
 * A `knowledgebase_documents` row as the settings page shows it (a text
 * document's content is left out: it loads when it's opened).
 */
export default function parseKnowledgebaseDocumentRow({ row }: Params): KnowledgebaseDocument {
    return {
        id: Number(row.id),
        knowledgebase_id: Number(row.knowledgebase_id),
        name: row.name || "",
        source: row.source == "text" ? "text" : "file",
        mime_type: row.mime_type || "",
        size: Number(row.size) || 0,
        chunk_count: Number(row.chunk_count) || 0,
        embedding_model: row.embedding_model || null,
        ingested_at: typeof row.ingested_at == "number" ? row.ingested_at : null,
        ingest_error: row.ingest_error || null,
        indexing: row.indexing == undefined ? !row.ingested_at && !row.ingest_error : Boolean(row.indexing),
        created_at: typeof row.created_at == "number" ? row.created_at : null,
    };
}
