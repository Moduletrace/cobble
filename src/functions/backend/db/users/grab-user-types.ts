import type {
    BUN_SQLITE_COBBLE_USER_TYPES,
    BunSQLiteTables,
} from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    user_id: number | string;
};

/**
 * All `user_types` rows for a user (including `revoked`).
 */
export default async function grabUserTypes({
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_USER_TYPES[]> {
    const res = await BunSQLite.select<
        BUN_SQLITE_COBBLE_USER_TYPES,
        (typeof BunSQLiteTables)[number]
    >({
        table: "user_types",
        query: {
            query: {
                user_id: {
                    value: user_id,
                },
            },
        },
    });

    return res.payload || [];
}
