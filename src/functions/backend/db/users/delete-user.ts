import BunSQLite from "@moduletrace/bun-sqlite";
import deleteMedia from "@/src/functions/backend/db/media/delete-media";
import AppError from "@/src/utils/app-error";
import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import parseUserTypes from "@/src/utils/parse-user-types";
import canRevokeUser from "@/src/utils/rbac/can-revoke-user";
import { clearEnvCache } from "../envs/grab-all-envs";
import grabUsers from "./grab-users";
import deleteChatrooms from "../chatrooms/delete-chatrooms";

type Params = {
    /**
     * Who is deleting: never themselves.
     */
    actor_user_id: number | string;
    /**
     * Whoever may revoke a user may delete them (`canRevokeUser`).
     */
    actor_user_types: BUN_SQLITE_COBBLE_USER_TYPES[];
    user_id: number | string;
};

/**
 * Deletes a user with everything that's theirs (their conversations,
 * routines, access, what bots remember about them, personal secrets, user
 * types, password, media and its files). Bots, workspaces and computers belong to the
 * install and stay, pictures they uploaded for them too. Their audit log
 * entries stay as well. The super admin can't be deleted, and nobody
 * deletes themselves.
 */
export default async function deleteUser({ actor_user_id, actor_user_types, user_id }: Params) {
    if (String(actor_user_id) == String(user_id)) {
        throw new AppError(`You can't delete yourself.`);
    }

    const user = (await grabUsers({ user_id })).singleRes;

    if (!user?.id) {
        throw new AppError(`User not found.`);
    }

    if (parseUserTypes({ user_types: user.user_types }).includes("super_admin")) {
        throw new AppError(`The super admin can't be deleted.`);
    }

    const target_user_types = parseUserTypes({ user_types: user.user_types }).map((user_type) => ({ user_type }));

    if (!canRevokeUser({ user_types: actor_user_types, target_user_types })) {
        throw new AppError(`You can't delete ${user.first_name || "this user"}.`);
    }

    const media_ids =
        (
            await BunSQLite.sql<{ id: number }>({
                sql: `SELECT id FROM media WHERE user_id = ?
                    AND id NOT IN (SELECT image_media_id FROM bots WHERE image_media_id IS NOT NULL)
                    AND id NOT IN (SELECT image_media_id FROM workspaces WHERE image_media_id IS NOT NULL)`,
                values: [user.id],
            })
        ).payload?.map((media) => media.id) || [];

    if (media_ids.length) {
        await deleteMedia({ ids: media_ids, user_id: user.id });
    }

    await deleteChatrooms({ user_id: user.id });

    const res = await BunSQLite.sql({ sql: `DELETE FROM users WHERE id = ?`, values: [user.id] });

    if (!res.success) {
        throw new Error(`Couldn't delete the user: ${res.error}`);
    }

    /**
     * These point at the user without a foreign key, so nothing cascades.
     */
    for (const table of ["user_types", "user_passwords", "sso_login_codes", "secret_requests", "bot_graphics"]) {
        await BunSQLite.sql({ sql: `DELETE FROM ${table} WHERE user_id = ?`, values: [user.id] });
    }

    /**
     * Their personal secrets, explicitly: foreign keys are off outside the
     * server process.
     */
    await BunSQLite.sql({ sql: `DELETE FROM envs WHERE paradigm = 'user' AND user_id = ?`, values: [user.id] });
    clearEnvCache();

    return user;
}
