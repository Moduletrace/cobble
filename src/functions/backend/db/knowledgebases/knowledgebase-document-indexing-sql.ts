/**
 * Whether a `knowledgebase_documents` row aliased `d` is being read: never
 * read yet, or with an ingest job still waiting or running (a re-index
 * leaves `ingested_at` set while it reads the document again).
 */
export const KnowledgebaseDocumentIndexingSql = `((d.ingested_at IS NULL AND d.ingest_error IS NULL)
    OR EXISTS (SELECT 1 FROM file_ingest_queue q WHERE q.document_id = d.id AND q.status IN ('pending', 'processing')))`;
