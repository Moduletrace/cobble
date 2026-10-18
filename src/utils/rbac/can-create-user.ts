import type { BUN_SQLITE_BSQLITE_USER_TYPES } from "@/db/types/db";
import checkUserAccess from "@/src/functions/backend/auth/check-user-access";
import isPassThroughUser from "./is-pass-through-user";
import { UserManagementUserTypes } from "@/src/dict/user-types-dict";

type Params = {
    user_types?: BUN_SQLITE_BSQLITE_USER_TYPES[] | null;
};

/**
 * Whether the actor may create new user records. User type assignment on
 * the new record is still limited by the assignment matrix.
 */
export default function canCreateUser({ user_types }: Params): boolean {
    if (isPassThroughUser({ user_types })) {
        return true;
    }

    return checkUserAccess({
        user_types,
        includes: UserManagementUserTypes,
    }).success;
}