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
     * The workspace the run is in (`bot_sessions.workspace_id`): then only
     * that workspace's tasks are in reach, never another workspace's nor
     * the bot's own list outside one.
     */
    workspace_id?: number | string | null;
    /**
     * The table alias the condition reads.
     */
    alias?: string;
};

/**
 * The tasks a bot's run reaches. A task belongs to one bot by default: a
 * worker reaches its own list and the tasks it has in the workspaces it
 * still works in, never another bot's, plus every workspace-wide task (no
 * bot) in those workspaces. A workspace admin also reaches every task in
 * that workspace; the coordinator every task in the install. A run in a
 * workspace is scoped to it: its session reaches nothing outside it, which
 * is the whole point of working there.
 */
export default function botTaskScopesSql({
    bot_id,
    is_coordinator,
    admin_workspace_ids = [],
    workspace_id,
    alias = "t",
}: Params): SqlCondition {
    if (workspace_id) {
        const id = Number(workspace_id);

        if (is_coordinator || admin_workspace_ids.map(Number).includes(id)) {
            return { sql: `${alias}.workspace_id = ?`, values: [id] };
        }

        return {
            sql: `(${alias}.workspace_id = ? AND ${alias}.workspace_id IN (SELECT workspace_id FROM workspace_bots WHERE bot_id = ?) AND (${alias}.bot_id = ? OR ${alias}.bot_id IS NULL))`,
            values: [id, Number(bot_id), Number(bot_id)],
        };
    }

    if (is_coordinator) return { sql: `1`, values: [] };

    const admin_ids = admin_workspace_ids.map(Number).filter(Boolean);
    const admin_sql = admin_ids.length
        ? `OR ${alias}.workspace_id IN (${admin_ids.map(() => "?").join(", ")})`
        : "";

    return {
        sql: `(
            (${alias}.bot_id = ? AND ${alias}.workspace_id IS NULL)
            OR (${alias}.workspace_id IS NOT NULL
                AND (${alias}.bot_id = ? OR ${alias}.bot_id IS NULL)
                AND ${alias}.workspace_id IN (SELECT workspace_id FROM workspace_bots WHERE bot_id = ?))
            ${admin_sql}
        )`,
        values: [Number(bot_id), Number(bot_id), Number(bot_id), ...admin_ids],
    };
}
