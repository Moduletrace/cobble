import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_USER_PASSWORDS,
    BunSQLiteTables,
} from "@/db/types/db";
import hashPassword from "./hash-password";
import deleteUserSSOCodes from "./delete-user-sso-codes";
import AppError from "@/src/utils/app-error";

type Params = {
    user_id: number;
    password: string;
};

/**
 * Creates or replaces the user's password. Outstanding login codes are
 * revoked, since a code issued before the change would skip the new
 * password.
 */
export default async function setUserPassword({ user_id, password }: Params) {
    const password_hash = await hashPassword({ password });

    const res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_USER_PASSWORDS,
        (typeof BunSQLiteTables)[number]
    >({
        table: "user_passwords",
        data: [
            {
                user_id,
                password_hash,
            },
        ],
        update_on_duplicate: true,
    });

    if (!res.success) {
        throw new AppError(`Couldn't save your password. Please try again.`);
    }

    await deleteUserSSOCodes({ user_id });
}
