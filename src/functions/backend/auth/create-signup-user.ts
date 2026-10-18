import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_USERS,
    BUN_SQLITE_COBBLE_USER_TYPES,
    BunSQLiteTables,
} from "@/db/types/db";
import AppError from "@/src/utils/app-error";

type Params = {
    first_name: string;
    last_name?: string;
    email: string;
    username: string;
};

/**
 * Creates a self-signup account with the default `read_only` user type
 * and returns its id.
 */
export default async function createSignupUser({
    first_name,
    last_name,
    email,
    username,
}: Params) {
    const new_user_res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_USERS,
        (typeof BunSQLiteTables)[number]
    >({
        table: "users",
        data: [
            {
                first_name,
                last_name: last_name || "",
                email,
                username,
            },
        ],
    });

    /**
     * bun-sqlite inserts with `RETURNING *` by default, so the new row
     * comes back as `singleRes` (with `insertId` as a fallback).
     */
    const new_user_id =
        new_user_res.singleRes?.id || new_user_res.postInsertReturn?.insertId;

    if (!new_user_id) {
        throw new AppError(`Couldn't create your account. Please try again.`);
    }

    const type_res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_USER_TYPES,
        (typeof BunSQLiteTables)[number]
    >({
        table: "user_types",
        data: [
            {
                user_id: new_user_id,
                user_type: "read_only",
            },
        ],
    });

    if (!type_res.success) {
        throw new AppError(`Couldn't create your account. Please try again.`);
    }

    return new_user_id;
}
