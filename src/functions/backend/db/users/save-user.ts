import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_USERS,
    BUN_SQLITE_COBBLE_USER_TYPES,
    BunSQLiteTables,
} from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import { UneditableUserTypes, UserTypes } from "@/src/dict/user-types-dict";
import setUserPassword from "@/src/functions/backend/auth/set-user-password";
import type { SaveUserRequest } from "@/src/schemas/user-schema";
import AppError from "@/src/utils/app-error";
import parseUserTypes from "@/src/utils/parse-user-types";
import userTypeAssignment from "@/src/utils/rbac/user-type-assignment";
import validatePassword from "@/src/utils/validate-password";
import grabUsers from "./grab-users";

type Params = SaveUserRequest & {
    /**
     * The user types of whoever is saving: what they may grant or remove
     * is the assignment matrix's call (`userTypeAssignment`).
     */
    actor_user_types: BUN_SQLITE_COBBLE_USER_TYPES[];
};

/**
 * Creates a user (a password is required: login is password only) or
 * updates one, then sets their user types to `user_types`: each one
 * granted or removed must pass the assignment matrix, and uneditable ones
 * (`super_admin`) stay as they are. The super admin's types are never
 * changed here, and they can't be revoked. A user needs at least one type to sign
 * in. Email and username stay unique. Returns the user's id and whether
 * they're new.
 */
export default async function saveUser({
    actor_user_types,
    user_id,
    first_name,
    last_name,
    email,
    username,
    password,
    user_types,
}: Params) {
    email = email.trim().toLowerCase();
    username = username.trim().toLowerCase();

    if (!AppData["UsernameRegex"].test(username)) {
        throw new AppError(`Usernames must be 3-32 characters: lowercase letters, numbers, dots, dashes or underscores`);
    }

    if (password || !user_id) {
        const password_error = validatePassword({ password });
        if (password_error) throw new AppError(password_error);
    }

    const existing = user_id ? (await grabUsers({ user_id })).singleRes : null;

    if (user_id && !existing?.id) {
        throw new AppError(`User not found.`);
    }

    const current = parseUserTypes({ user_types: existing?.user_types });
    const is_super_admin = current.includes("super_admin");

    if (is_super_admin && user_types.includes("revoked")) {
        throw new AppError(`The super admin can't be revoked.`);
    }

    const kept = is_super_admin ? current : current.filter((type) => UneditableUserTypes.includes(type));
    const wanted = is_super_admin
        ? []
        : [...new Set(user_types)].filter((type) => !UneditableUserTypes.includes(type));
    const added = wanted.filter((type) => !current.includes(type));
    const removed = current.filter((type) => !kept.includes(type) && !wanted.includes(type));

    if (!kept.length && !wanted.length) {
        throw new AppError(`Give them at least one user type, or they can't sign in.`);
    }

    for (const [types, action] of [[added, "assign"], [removed, "delete"]] as const) {
        for (const target_user_type of types) {
            if (!userTypeAssignment({ actor_user_types, target_user_type, target_user_types: current, action })) {
                const title = UserTypes.find((type) => type.value == target_user_type)?.title || target_user_type;
                throw new AppError(`You can't ${action == "assign" ? "grant" : "remove"} ${title}.`);
            }
        }
    }

    const taken = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_USERS>({
            sql: `SELECT id, email, username FROM users WHERE (email = ? OR username = ?) AND id != ? LIMIT 1`,
            values: [email, username, user_id || 0],
        })
    ).payload?.[0];

    if (taken) {
        throw new AppError(taken.email == email ? `That email is already in use.` : `That username is taken.`);
    }

    let target_id = Number(user_id || 0);

    if (existing?.id) {
        const res = await BunSQLite.update<BUN_SQLITE_COBBLE_USERS, (typeof BunSQLiteTables)[number]>({
            table: "users",
            targetId: existing.id,
            data: { first_name, last_name, email, username },
        });

        if (!res.success) throw new Error(`Couldn't update the user: ${res.msg}`);
    } else {
        const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_USERS, (typeof BunSQLiteTables)[number]>({
            table: "users",
            data: [{ first_name, last_name, email, username }],
        });

        target_id = Number(res.singleRes?.id || res.postInsertReturn?.insertId || 0);

        if (!res.success || !target_id) throw new Error(`Couldn't create the user: ${res.msg}`);
    }

    if (password) {
        await setUserPassword({ user_id: target_id, password });
    }

    if (removed.length) {
        await BunSQLite.sql({
            sql: `DELETE FROM user_types WHERE user_id = ? AND user_type IN (${removed.map(() => "?").join(", ")})`,
            values: [target_id, ...removed],
        });
    }

    if (added.length) {
        await BunSQLite.insert<BUN_SQLITE_COBBLE_USER_TYPES, (typeof BunSQLiteTables)[number]>({
            table: "user_types",
            data: added.map((user_type) => ({ user_id: target_id, user_type })),
        });
    }

    return { user_id: target_id, created: !existing?.id };
}
