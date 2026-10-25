import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import grabUserTypes from "@/src/functions/backend/db/users/grab-user-types";
import type { UserType } from "@/src/types";
import userTypeAssignment from "@/src/utils/rbac/user-type-assignment";

type Params = {
    rows: Partial<BUN_SQLITE_COBBLE_USER_TYPES>[];
    actor_user_types: BUN_SQLITE_COBBLE_USER_TYPES[];
    action: "assign" | "delete";
};

/**
 * The `user_types` rows the actor may grant or remove, judged like
 * `saveUser` does: against the assignment matrix and the target user's
 * current types (`userTypeAssignment`), so an admin can't mark another
 * admin or the super admin read-only through the CRUD API. A row with no
 * user or no type is left out.
 */
export default async function filterAssignableRows({ rows, actor_user_types, action }: Params) {
    const current = new Map<string, UserType[]>();

    for (const row of rows) {
        const key = String(row.user_id ?? "");

        if (!key || current.has(key)) continue;

        const types = await grabUserTypes({ user_id: key });

        current.set(key, types.map((type) => type.user_type as UserType).filter(Boolean));
    }

    return rows.filter(
        (row) =>
            row.user_id &&
            row.user_type &&
            userTypeAssignment({
                actor_user_types,
                target_user_type: row.user_type as UserType,
                target_user_types: current.get(String(row.user_id)) || [],
                action,
            }),
    );
}
