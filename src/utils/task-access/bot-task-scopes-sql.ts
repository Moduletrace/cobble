import type { SqlCondition } from "./types";

type Params = {
    bot_id: number | string;
    /**
     * Whether the run is the coordinator, which reaches every task (every
     * bot's own and every workspace's).
     */
    is_coordinator: boolean;
    /**
     * The workspaces the bot is admin of: it also reaches the tasks it added
     * to their members' own lists.
     */
    admin_workspace_ids?: number[];
    /**
     * The table alias the condition reads.
     */
    alias?: string;
};

/**
 * The tasks a bot's run reaches: its own, plus every workspace it works in
 * (a workspace's tasks are shared by its bots). The coordinator reaches
 * every task in the install: every bot's own and every workspace's. A
 * workspace admin also reaches the tasks it put on that workspace's
 * members' own lists.
 */
export default function botTaskScopesSql({
    bot_id,
    is_coordinator,
    admin_workspace_ids = [],
    alias = "t",
}: Params): SqlCondition {
    if (is_coordinator) return { sql: `1`, values: [] };

    const admin_ids = admin_workspace_ids.map(Number).filter(Boolean);

    if (admin_ids.length) {
        const marks = admin_ids.map(() => "?").join(", ");

        return {
            sql: `(
            ${alias}.bot_id = ?
            OR (${alias}.workspace_id IS NOT NULL AND ${alias}.workspace_id IN (
                SELECT workspace_id FROM workspace_bots WHERE bot_id = ?
            ))
            OR (${alias}.created_by_bot_id = ? AND ${alias}.bot_id IN (
                SELECT bot_id FROM workspace_bots WHERE workspace_id IN (${marks})
            ))
        )`,
            values: [Number(bot_id), Number(bot_id), Number(bot_id), ...admin_ids],
        };
    }

    return {
        sql: `(
            ${alias}.bot_id = ?
            OR (${alias}.workspace_id IS NOT NULL AND ${alias}.workspace_id IN (
                SELECT workspace_id FROM workspace_bots WHERE bot_id = ?
            ))
        )`,
        values: [Number(bot_id), Number(bot_id)],
    };
}
