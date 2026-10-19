import type { CrewAccessParams, SqlCondition } from "./types";

/**
 * The computers a user opens and sees: super admins and admins every one,
 * anyone else only those of the bots they chat with (the computers of
 * their workspaces, those their assigned workers were given, and those of
 * the workspaces their assigned workers are attached to).
 */
export default function computersSql({ role, user_id, alias = "c" }: CrewAccessParams): SqlCondition {
    if (role != "member") return { sql: `1`, values: [] };

    return {
        sql: `${alias}.id IN (
            SELECT wc.computer_id FROM workspace_computers wc
            JOIN workspace_users wu ON wu.workspace_id = wc.workspace_id AND wu.user_id = ?
            UNION
            SELECT bc.computer_id FROM bot_computers bc
            JOIN bot_users bu ON bu.bot_id = bc.bot_id AND bu.user_id = ?
            JOIN bots b ON b.id = bc.bot_id AND b.kind != 'coordinator'
            UNION
            SELECT wc.computer_id FROM workspace_computers wc
            JOIN workspaces w ON w.id = wc.workspace_id AND w.archived = 0
            JOIN workspace_bots wb ON wb.workspace_id = w.id
            JOIN bot_users bu ON bu.bot_id = wb.bot_id AND bu.user_id = ?
            JOIN bots b ON b.id = wb.bot_id AND b.kind != 'coordinator'
        )`,
        values: [Number(user_id), Number(user_id), Number(user_id)],
    };
}
