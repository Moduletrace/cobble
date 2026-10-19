import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import parseUserTypes from "@/src/utils/parse-user-types";

type Params = {
    person: BUN_SQLITE_COBBLE_USERS_JOIN;
};

/**
 * Adds `revoked` to a user's types through `users/save-user`, as picking
 * Revoked in their edit form would. Everything else stays as it is.
 */
export default async function revokeUser({ person }: Params) {
    return await postAdminApi<BUN_SQLITE_COBBLE_USERS_JOIN>({
        path: "users/save-user",
        body: {
            user_id: person.id,
            first_name: person.first_name,
            last_name: person.last_name || "",
            email: person.email,
            username: person.username,
            user_types: [...parseUserTypes({ user_types: person.user_types }), "revoked"],
        },
    });
}
