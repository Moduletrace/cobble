import type { SqlCondition } from "./types";

type Params = {
    workspace_id: number | string;
    /**
     * The `users` alias the condition reads.
     */
    alias?: string;
};

/**
 * The users who work in a workspace (`workspacesSql` the other way
 * round): super admins and admins, who reach every workspace, and the
 * members added to it. Revoked users are left out: they can't sign in.
 */
export default function workspacePeopleSql({ workspace_id, alias = "u" }: Params): SqlCondition {
    return {
        sql: `NOT EXISTS (SELECT 1 FROM user_types WHERE user_id = ${alias}.id AND user_type = 'revoked')
            AND (
                EXISTS (SELECT 1 FROM user_types WHERE user_id = ${alias}.id AND user_type IN ('super_admin', 'admin'))
                OR EXISTS (SELECT 1 FROM workspace_users WHERE user_id = ${alias}.id AND workspace_id = ?)
            )`,
        values: [Number(workspace_id)],
    };
}
