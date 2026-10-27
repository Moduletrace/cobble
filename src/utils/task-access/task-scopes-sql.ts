import chatBotsSql from "../crew-access/chat-bots-sql";
import workspacesSql from "../crew-access/workspaces-sql";
import type { SqlCondition, TaskScopeSqlParams } from "./types";

/**
 * The tasks a user sees: the own list of a bot they chat with in its own
 * chat, and every task of a workspace they're in, whichever bot there has
 * it. Matches the crew access rules exactly, so a task can't be seen where
 * the bot or workspace cannot.
 */
export default function taskScopesSql({
    role,
    user_id,
    alias = "t",
}: TaskScopeSqlParams): SqlCondition {
    const bots = chatBotsSql({ role, user_id, alias: "tb" });
    const workspaces = workspacesSql({ role, user_id, alias: "tw" });

    return {
        sql: `(
            (${alias}.workspace_id IS NULL AND ${alias}.bot_id IN (SELECT tb.id FROM bots tb WHERE ${bots.sql}))
            OR (${alias}.workspace_id IS NOT NULL AND ${alias}.workspace_id IN (SELECT tw.id FROM workspaces tw WHERE ${workspaces.sql}))
        )`,
        values: [...bots.values, ...workspaces.values],
    };
}
