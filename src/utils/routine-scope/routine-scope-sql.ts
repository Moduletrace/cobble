import type { RoutineScopeSqlParams, SqlCondition } from "./types";

/**
 * The routines of one conversation: that bot's schedules in that workspace,
 * or, for its own chat, the ones that run nowhere (a routine made there
 * stays there even if the bot later joins a workspace). `workspace_id` is
 * NULL in SQLite rather than 0, so the two cases can't share a comparison.
 */
export default function routineScopeSql({
    bot_id,
    workspace_id,
    alias = "c",
}: RoutineScopeSqlParams): SqlCondition {
    if (workspace_id) {
        return {
            sql: `(${alias}.bot_id = ? AND ${alias}.workspace_id = ?)`,
            values: [Number(bot_id), Number(workspace_id)],
        };
    }

    return {
        sql: `(${alias}.bot_id = ? AND ${alias}.workspace_id IS NULL)`,
        values: [Number(bot_id)],
    };
}
