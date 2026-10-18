import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import isPassThroughUser from "./is-pass-through-user";
import { UserManagementUserTypes } from "@/src/dict/user-types-dict";

type Params = {
    user_types?: BUN_SQLITE_COBBLE_USER_TYPES[] | null;
};

/**
 * Whether the actor may manage user type records (insert or delete rows
 * in the `user_types` table). Which individual types they may grant or
 * remove is still enforced per type by the assignment matrix.
 */
export default function canManageUserTypes({
    user_types,
}: Params): boolean {
    if (isPassThroughUser({ user_types })) {
        return true;
    }

    return checkUserAccess({
        user_types,
        includes: UserManagementUserTypes,
    }).success;
}