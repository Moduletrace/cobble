/**
 * The statements that remove text stored outside knowledgebases: the old
 * bot file index (chunks and their vectors; the vec0 drop takes its shadow
 * tables with it), file jobs left on the ingest queue, and the extracted
 * text uploads used to keep. A knowledgebase document's media keeps its
 * text. Every statement is a no-op once it has run.
 */
export default function dropStoredFileTextSql(): string[] {
    return [
        `DROP TABLE IF EXISTS bot_file_vectors`,
        `DROP TABLE IF EXISTS bot_file_chunks`,
        `DELETE FROM file_ingest_queue WHERE document_id IS NULL`,
        `UPDATE media SET text_content = NULL
            WHERE text_content IS NOT NULL
              AND id NOT IN (SELECT media_id FROM knowledgebase_documents WHERE media_id IS NOT NULL)`,
    ];
}
