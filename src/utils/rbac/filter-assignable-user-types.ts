import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import type { UserType } from "@/src/types";
import userTypeAssignment from "./user-type-assignment";

type Params = {
    actor_user_types?: BUN_SQLITE_COBBLE_USER_TYPES[] | null;
    user_types: UserType[];
};

/**
 * Filters a list of user types down to the ones the actor may assign
 * (grant or remove), per the assignment matrix.
 */
export default function filterAssignableUserTypes({
    actor_user_types,
    user_types,
}: Params): UserType[] {
    return user_types.filter((target_user_type) =>
        userTypeAssignment({
            actor_user_types,
            target_user_type,
            action: "assign",
        }),
    );
}