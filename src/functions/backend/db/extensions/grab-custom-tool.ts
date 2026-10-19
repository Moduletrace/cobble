import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CUSTOM_TOOLS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import parseCustomToolRow from "./parse-custom-tool-row";

type Params = {
    custom_tool_id: number | string;
};

/**
 * One custom tool, or an `AppError` when there's none.
 */
export default async function grabCustomTool({ custom_tool_id }: Params) {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_CUSTOM_TOOLS>({
            sql: `SELECT * FROM custom_tools WHERE id = ?`,
            values: [custom_tool_id],
        })
    ).payload?.[0];

    if (!row) throw new AppError(`That tool doesn't exist.`);

    return parseCustomToolRow({ row });
}
