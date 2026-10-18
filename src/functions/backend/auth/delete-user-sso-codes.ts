import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_BSQLITE_SSO_LOGIN_CODES,
    BunSQLiteTables,
} from "@/db/types/db";

type Params = {
    user_id: string | number;
};

export default async function deleteUserSSOCodes({ user_id }: Params) {
    return await BunSQLite.delete<
        BUN_SQLITE_BSQLITE_SSO_LOGIN_CODES,
        (typeof BunSQLiteTables)[number]
    >({
        table: "sso_login_codes",
        query: {
            query: {
                user_id: {
                    value: user_id,
                },
            },
        },
    });
}
