import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    user_id: number | string;
    /**
     * Every worker assigned to them, replacing the old list. The
     * coordinator is never assigned. Left out: unchanged.
     */
    bot_ids?: number[];
    /**
     * Every workspace they're in, replacing the old list. Left out:
     * unchanged.
     */
    workspace_ids?: number[];
};

/**
 * Sets which workers a user chats with in their own chat (`bot_users`)
 * and which workspaces they work in (`workspace_users`). The caller checks
 * the actor manages the crew. Ids that aren't a worker or a workspace are
 * skipped.
 */
export default async function setUserAccess({ user_id, bot_ids, workspace_ids }: Params) {
    const now = Date.now();

    if (bot_ids) {
        await BunSQLite.sql({ sql: `DELETE FROM bot_users WHERE user_id = ?`, values: [user_id] });

        for (const bot_id of new Set(bot_ids)) {
            await BunSQLite.sql({
                sql: `INSERT OR IGNORE INTO bot_users (created_at, updated_at, bot_id, user_id)
                    SELECT ?, ?, id, ? FROM bots WHERE id = ? AND kind = 'worker'`,
                values: [now, now, user_id, bot_id],
            });
        }
    }

    if (workspace_ids) {
        await BunSQLite.sql({ sql: `DELETE FROM workspace_users WHERE user_id = ?`, values: [user_id] });

        for (const workspace_id of new Set(workspace_ids)) {
            await BunSQLite.sql({
                sql: `INSERT OR IGNORE INTO workspace_users (created_at, updated_at, workspace_id, user_id)
                    SELECT ?, ?, id, ? FROM workspaces WHERE id = ?`,
                values: [now, now, user_id, workspace_id],
            });
        }
    }
}
