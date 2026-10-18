import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_BSQLITE_USERS, BunSQLiteTables } from "@/db/types/db";

type Params = {
    identifier: string;
};

/**
 * Looks a user up by email or username.
 */
export default async function findUserByIdentifier({ identifier }: Params) {
    return (
        await BunSQLite.select<
            BUN_SQLITE_BSQLITE_USERS,
            (typeof BunSQLiteTables)[number]
        >({
            table: "users",
            query: {
                query: {
                    email: {
                        value: identifier,
                    },
                    username: {
                        value: identifier,
                    },
                },
                searchOperator: "OR",
            },
        })
    )?.singleRes;
}
