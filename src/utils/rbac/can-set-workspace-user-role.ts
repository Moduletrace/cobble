import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import crewRole from "./crew-role";

type UserTypes = Pick<BUN_SQLITE_COBBLE_USER_TYPES, "user_type">[] | null;

type Params = {
    actor_user_types?: UserTypes;
    /**
     * The user whose role in a workspace is being set.
     */
    target_user_types?: UserTypes;
};

/**
 * Whether the actor sets (or clears) a user's role in a workspace
 * (`workspace_user_roles`): only crew managers, never the user themselves
 * unless they are one. The super admin sets anyone's, theirs included; an
 * admin anyone's but a super admin's.
 */
export default function canSetWorkspaceUserRole({ actor_user_types, target_user_types }: Params): boolean {
    const actor = crewRole({ user_types: actor_user_types });

    if (actor == "member") return false;
    if (actor == "super_admin") return true;

    return crewRole({ user_types: target_user_types }) != "super_admin";
}
