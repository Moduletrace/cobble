import type { BUN_SQLITE_COBBLE_LOGS_JOIN } from "@/src/types/sql-joins";
import type { ServerQueryParam } from "@moduletrace/bun-sqlite";
import type { LogCategoryValue } from "../(data)/log-category-styles";

type Params = {
    category?: LogCategoryValue;
};

/**
 * Logs query, newest first, with the acting user's name joined in.
 */
export default function getLogsQuery({
    category,
}: Params): ServerQueryParam<BUN_SQLITE_COBBLE_LOGS_JOIN> {
    return {
        order: { field: "created_at", strategy: "DESC" },
        query: category ? { category: { value: category } } : undefined,
        join: [
            {
                joinType: "LEFT JOIN",
                tableName: "users",
                match: { source: "user_id", target: "id" },
                selectFields: [
                    { field: "first_name", alias: "user_first_name" },
                    { field: "last_name", alias: "user_last_name" },
                ],
            },
        ],
    };
}
