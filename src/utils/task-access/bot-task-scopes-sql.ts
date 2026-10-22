import type { SqlCondition } from "./types";

type Params = {
    bot_id: number | string;
    /**
     * Whether the run is the coordinator, which reaches every task (every
     * bot's own and every workspace's).
     */
    is_coordinator: boolean;
    /**
     * The table alias the condition reads.
     */
    alias?: string;
};

/**
 * The tasks a bot's run reaches: its own, plus every workspace it works in
 * (a workspace's tasks are shared by its bots). The coordinator reaches
 * every task in the install: every bot's own and every workspace's.
 */
export default function botTaskScopesSql({
    bot_id,
    is_coordinator,
    alias = "t",
}: Params): SqlCondition {
    if (is_coordinator) return { sql: `1`, values: [] };

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
