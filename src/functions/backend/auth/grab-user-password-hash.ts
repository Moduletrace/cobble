import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_BSQLITE_USER_PASSWORDS,
    BunSQLiteTables,
} from "@/db/types/db";

type Params = {
    user_id: string | number;
};

/**
 * Server-only. Password hashes live in their own table so that no user
 * query can ever return them.
 */
export default async function grabUserPasswordHash({ user_id }: Params) {
    const record = (
        await BunSQLite.select<
            BUN_SQLITE_BSQLITE_USER_PASSWORDS,
            (typeof BunSQLiteTables)[number]
        >({
            table: "user_passwords",
            query: {
                query: {
                    user_id: {
                        value: user_id,
                    },
                },
            },
        })
    ).singleRes;

    return record?.password_hash || undefined;
}
