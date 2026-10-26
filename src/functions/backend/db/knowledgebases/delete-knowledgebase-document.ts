import BunSQLite from "@moduletrace/bun-sqlite";
import { rmSync } from "node:fs";
import mediaFilePath from "@/src/utils/media-file-path";
import grabKnowledgebaseDocumentRow from "./grab-knowledgebase-document-row";

type Params = {
    document_id: number | string;
};

/**
 * Deletes a knowledgebase document: its vectors, chunks (and their
 * full-text index rows), pending ingest,
 * row and (for a file) its bytes and `media` row. Children are deleted here
 * rather than left to the schema's cascade, since foreign keys are off
 * outside the server process.
 */
export default async function deleteKnowledgebaseDocument({ document_id }: Params) {
    const document = await grabKnowledgebaseDocumentRow({ document_id });

    await BunSQLite.sql({ sql: `DELETE FROM knowledgebase_vectors WHERE document_id = ?`, values: [document.id] });
    await BunSQLite.sql({
        sql: `DELETE FROM knowledgebase_chunks_fts WHERE document_id = ?`,
        values: [document.id],
    }).catch(() => {});
    await BunSQLite.sql({ sql: `DELETE FROM knowledgebase_chunks WHERE document_id = ?`, values: [document.id] });
    await BunSQLite.sql({
        sql: `DELETE FROM file_ingest_queue WHERE document_id = ? AND status IN ('pending', 'processing')`,
        values: [document.id],
    }).catch(() => {});
    await BunSQLite.sql({ sql: `DELETE FROM knowledgebase_documents WHERE id = ?`, values: [document.id] });

    if (document.media_id) {
        const media = await BunSQLite.sql<{ media_write_path?: string; media_thumbnail_write_path?: string }>({
            sql: `SELECT media_write_path, media_thumbnail_write_path FROM media WHERE id = ? LIMIT 1`,
            values: [document.media_id],
        }).then((res) => res.payload?.[0]);

        for (const write_path of [media?.media_write_path, media?.media_thumbnail_write_path]) {
            const absolute = mediaFilePath({ write_path });

            if (absolute) rmSync(absolute, { force: true });
        }

        await BunSQLite.sql({ sql: `DELETE FROM media_paradigms WHERE media_id = ?`, values: [document.media_id] });
        await BunSQLite.sql({ sql: `DELETE FROM media WHERE id = ?`, values: [document.media_id] });
    }

    return document;
}
