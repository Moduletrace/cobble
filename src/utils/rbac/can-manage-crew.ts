import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import crewRole from "./crew-role";

type Params = {
    user_types?: Pick<BUN_SQLITE_COBBLE_USER_TYPES, "user_type">[] | null;
};

/**
 * Whether the user creates, edits and deletes workers and workspaces, and
 * assigns them to users: super admins and admins. Only the super admin
 * edits the coordinator.
 */
export default function canManageCrew({ user_types }: Params): boolean {
    return crewRole({ user_types }) != "member";
}
