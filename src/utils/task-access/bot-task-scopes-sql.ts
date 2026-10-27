import type { SqlCondition } from "./types";

type Params = {
    bot_id: number | string;
    /**
     * Whether the run is the coordinator, which reaches every task (every
     * bot's own and every workspace's).
     */
    is_coordinator: boolean;
    /**
     * The workspaces the bot is admin of: it reaches every task there,
     * whoever has it.
     */
    admin_workspace_ids?: number[];
    /**
     * The table alias the condition reads.
     */
    alias?: string;
};

/**
 * The tasks a bot's run reaches: its own list, and in every workspace it
 * works in the tasks it has there plus the shared ones nobody has yet.
 * Another bot's task in a workspace is that bot's. A workspace admin
 * reaches every task in that workspace; the coordinator every task in the
 * install.
 */
export default function botTaskScopesSql({
    bot_id,
    is_coordinator,
    admin_workspace_ids = [],
    alias = "t",
}: Params): SqlCondition {
    if (is_coordinator) return { sql: `1`, values: [] };

    const admin_ids = admin_workspace_ids.map(Number).filter(Boolean);
    const admin_sql = admin_ids.length
        ? `OR ${alias}.workspace_id IN (${admin_ids.map(() => "?").join(", ")})`
        : "";

    return {
        sql: `(
            (${alias}.bot_id = ? AND ${alias}.workspace_id IS NULL)
            OR (${alias}.workspace_id IS NOT NULL
                AND (${alias}.bot_id IS NULL OR ${alias}.bot_id = ?)
                AND ${alias}.workspace_id IN (SELECT workspace_id FROM workspace_bots WHERE bot_id = ?))
            ${admin_sql}
        )`,
        values: [Number(bot_id), Number(bot_id), Number(bot_id), ...admin_ids],
    };
}
