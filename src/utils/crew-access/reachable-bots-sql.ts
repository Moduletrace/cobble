import type { CrewAccessParams, SqlCondition } from "./types";
import chatBotsSql from "./chat-bots-sql";

/**
 * The bots a user reaches at all: the ones in their own chat
 * (`chatBotsSql`) plus, outside it, every worker attached to a workspace
 * they were added to. The same condition `grabUserBot` applies, so a
 * picker built from it lists exactly the folders the resolver opens. The
 * coordinator is the super admin's alone.
 */
export default function reachableBotsSql({
    role,
    user_id,
    alias = "b",
}: CrewAccessParams): SqlCondition {
    const chat = chatBotsSql({ role, user_id, alias });

    if (role != "member") return chat;

    return {
        sql: `(${chat.sql} OR (${alias}.kind != 'coordinator' AND ${alias}.id IN (
            SELECT wb.bot_id FROM workspace_bots wb
            JOIN workspace_users wu ON wu.workspace_id = wb.workspace_id AND wu.user_id = ?
            JOIN workspaces w ON w.id = wb.workspace_id AND w.archived = 0
        )))`,
        values: [...chat.values, Number(user_id)],
    };
}
