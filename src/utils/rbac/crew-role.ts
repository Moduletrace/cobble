import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";

type Params = {
    user_types?: Pick<BUN_SQLITE_COBBLE_USER_TYPES, "user_type">[] | null;
};

export type CrewRole = "super_admin" | "admin" | "member";

/**
 * How a user reaches the crew. `super_admin`: everything, the coordinator
 * included (no one else ever reaches it). `admin`: every worker and
 * workspace, and hands out access. `member` (everyone else): only the
 * workers assigned to them (`bot_users`) and the workspaces they were
 * added to (`workspace_users`).
 */
export default function crewRole({ user_types }: Params): CrewRole {
    const types = new Set(user_types?.map((ut) => ut.user_type));

    if (types.has("super_admin")) return "super_admin";
    if (types.has("admin")) return "admin";

    return "member";
}
