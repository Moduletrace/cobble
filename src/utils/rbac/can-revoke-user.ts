import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import type { UserType } from "@/src/types";
import userTypeAssignment from "./user-type-assignment";

type Params = {
    user_types?: BUN_SQLITE_COBBLE_USER_TYPES[] | null;
    target_user_types?: BUN_SQLITE_COBBLE_USER_TYPES[] | null;
};

/**
 * Whether the actor may revoke a user (i.e. add the `revoked` user type).
 *
 * - A user holding the `super_admin` type can never be revoked.
 * - Otherwise governed by the assignment matrix for the `revoked` type:
 *   pass-through actors (`super_admin`) may revoke anyone, and `admin`
 *   may revoke users who do not hold an excluded protected type.
 */
export default function canRevokeUser({
    user_types,
    target_user_types,
}: Params): boolean {
    if (target_user_types?.some((ut) => ut.user_type === "super_admin")) {
        return false;
    }

    const target_user_type_values: UserType[] | undefined = target_user_types
        ?.map((ut) => ut.user_type)
        .filter((ut) => Boolean(ut)) as UserType[] | undefined;

    return userTypeAssignment({
        actor_user_types: user_types,
        target_user_type: "revoked",
        target_user_types: target_user_type_values,
        action: "assign",
    });
}