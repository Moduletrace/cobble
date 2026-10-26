import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_KNOWLEDGEBASE_DOCUMENTS, BunSQLiteTables } from "@/db/types/db";
import type { KnowledgebaseDocumentSource } from "@/src/dict/knowledgebase-dict";
import enqueueDocumentIngest from "@/src/file-ingest/enqueue-document-ingest";
import grabKnowledgebase from "./grab-knowledgebase";

type Params = {
    user_id: number | string;
    knowledgebase_id: number | string;
    name: string;
    source: KnowledgebaseDocumentSource;
    media_id?: number | null;
    content?: string | null;
    mime_type?: string;
    size: number;
};

/**
 * Adds a document to a knowledgebase and queues it to be chunked and
 * embedded. Returns its id.
 */
export default async function recordKnowledgebaseDocument({
    user_id,
    knowledgebase_id,
    name,
    source,
    media_id,
    content,
    mime_type,
    size,
}: Params) {
    const knowledgebase = await grabKnowledgebase({ knowledgebase_id });

    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_KNOWLEDGEBASE_DOCUMENTS, (typeof BunSQLiteTables)[number]>({
        table: "knowledgebase_documents",
        data: [
            {
                knowledgebase_id: knowledgebase.id,
                name,
                source,
                media_id: media_id || undefined,
                content: content || undefined,
                mime_type: mime_type || "",
                size,
                user_id: Number(user_id),
            },
        ],
    });

    const id = res.postInsertReturn?.insertId;

    if (!res.success || !id) throw new Error(`Couldn't add the document: ${res.msg || res.error}`);

    await touchKnowledgebase({ knowledgebase_id: knowledgebase.id });
    await enqueueDocumentIngest({ document_id: id });

    return Number(id);
}

/**
 * Marks a knowledgebase changed, for its "updated" line.
 */
export async function touchKnowledgebase({ knowledgebase_id }: { knowledgebase_id: number | string }) {
    await BunSQLite.sql({
        sql: `UPDATE knowledgebases SET updated_at = ? WHERE id = ?`,
        values: [Date.now(), knowledgebase_id],
    });
}
