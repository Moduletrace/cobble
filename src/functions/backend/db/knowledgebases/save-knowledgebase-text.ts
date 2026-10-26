import BunSQLite from "@moduletrace/bun-sqlite";
import enqueueDocumentIngest from "@/src/file-ingest/enqueue-document-ingest";
import type { SaveKnowledgebaseTextRequest } from "@/src/schemas/knowledgebase-schema";
import AppError from "@/src/utils/app-error";
import grabKnowledgebaseDocumentRow from "./grab-knowledgebase-document-row";
import recordKnowledgebaseDocument, { touchKnowledgebase } from "./record-knowledgebase-document";

type Params = {
    user_id: number | string;
    data: SaveKnowledgebaseTextRequest;
};

/**
 * Writes a text document into a knowledgebase, or changes one, and queues
 * it to be read again. Returns its id.
 */
export default async function saveKnowledgebaseText({ user_id, data }: Params) {
    const size = Buffer.byteLength(data.content, "utf8");

    if (!data.document_id) {
        return await recordKnowledgebaseDocument({
            user_id,
            knowledgebase_id: data.knowledgebase_id,
            name: data.name,
            source: "text",
            content: data.content,
            mime_type: "text/markdown",
            size,
        });
    }

    const document = await grabKnowledgebaseDocumentRow({ document_id: data.document_id });

    if (Number(document.knowledgebase_id) != data.knowledgebase_id || document.source != "text") {
        throw new AppError(`Only a text document can be edited here.`);
    }

    const res = await BunSQLite.sql({
        sql: `UPDATE knowledgebase_documents SET name = ?, content = ?, size = ?, ingested_at = NULL,
                ingest_error = NULL, updated_at = ? WHERE id = ?`,
        values: [data.name, data.content, size, Date.now(), document.id],
    });

    if (!res.success) throw new Error(`Couldn't save the document: ${res.error}`);

    await touchKnowledgebase({ knowledgebase_id: data.knowledgebase_id });
    await enqueueDocumentIngest({ document_id: document.id! });

    return Number(document.id);
}
