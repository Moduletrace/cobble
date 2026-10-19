import type { CrewAccessParams, SqlCondition } from "./types";

/**
 * The workspaces a user works in: super admins and admins every one,
 * anyone else only those they were added to.
 */
export default function workspacesSql({ role, user_id, alias = "w" }: CrewAccessParams): SqlCondition {
    if (role != "member") return { sql: `1`, values: [] };

    return {
        sql: `${alias}.id IN (SELECT workspace_id FROM workspace_users WHERE user_id = ?)`,
        values: [Number(user_id)],
    };
}
