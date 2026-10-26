import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_KNOWLEDGEBASES } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import parseKnowledgebaseRow from "./parse-knowledgebase-row";

type Params = {
    knowledgebase_id: number | string;
};

/**
 * One knowledgebase, or an `AppError` when there's none.
 */
export default async function grabKnowledgebase({ knowledgebase_id }: Params) {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_KNOWLEDGEBASES>({
            sql: `SELECT * FROM knowledgebases WHERE id = ?`,
            values: [knowledgebase_id],
        })
    ).payload?.[0];

    if (!row) throw new AppError(`That knowledgebase doesn't exist.`);

    return parseKnowledgebaseRow({ row });
}
