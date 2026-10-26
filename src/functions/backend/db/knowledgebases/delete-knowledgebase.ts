import BunSQLite from "@moduletrace/bun-sqlite";
import deleteKnowledgebaseDocument from "./delete-knowledgebase-document";
import grabKnowledgebase from "./grab-knowledgebase";

type Params = {
    knowledgebase_id: number | string;
};

/**
 * Deletes a knowledgebase with everything in it: each document (its
 * vectors, chunks and bytes), then its bot and workspace links. All
 * deleted here rather than left to the schema's cascade, since foreign
 * keys are off outside the server process.
 */
export default async function deleteKnowledgebase({ knowledgebase_id }: Params) {
    const knowledgebase = await grabKnowledgebase({ knowledgebase_id });

    const documents = await BunSQLite.sql<{ id: number }>({
        sql: `SELECT id FROM knowledgebase_documents WHERE knowledgebase_id = ?`,
        values: [knowledgebase.id],
    });

    for (const document of documents.payload || []) {
        await deleteKnowledgebaseDocument({ document_id: document.id });
    }

    await BunSQLite.sql({ sql: `DELETE FROM bot_knowledgebases WHERE knowledgebase_id = ?`, values: [knowledgebase.id] });
    await BunSQLite.sql({
        sql: `DELETE FROM workspace_knowledgebases WHERE knowledgebase_id = ?`,
        values: [knowledgebase.id],
    });

    const res = await BunSQLite.sql({ sql: `DELETE FROM knowledgebases WHERE id = ?`, values: [knowledgebase.id] });

    if (!res.success) throw new Error(`Couldn't delete the knowledgebase: ${res.error}`);

    return knowledgebase;
}
