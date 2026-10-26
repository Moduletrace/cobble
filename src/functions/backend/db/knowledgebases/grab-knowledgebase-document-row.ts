import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_KNOWLEDGEBASE_DOCUMENTS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";

type Params = {
    document_id: number | string;
};

/**
 * One knowledgebase document's row, content included, or an `AppError`
 * when there's none.
 */
export default async function grabKnowledgebaseDocumentRow({ document_id }: Params) {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_KNOWLEDGEBASE_DOCUMENTS>({
            sql: `SELECT * FROM knowledgebase_documents WHERE id = ?`,
            values: [document_id],
        })
    ).payload?.[0];

    if (!row?.id) throw new AppError(`That document doesn't exist.`);

    return { ...row, id: Number(row.id) };
}
