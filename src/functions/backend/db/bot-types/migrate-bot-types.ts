import BunSQLite from "@moduletrace/bun-sqlite";

/**
 * Brings `bot_types` rows from v0.2.8 and earlier up to date, safe to run
 * on every start: the coordinator is its `bots.kind` now, so its old
 * `coordinator` row (and any row without a workspace) goes, and `admin`
 * became `workspace_admin`.
 */
export default async function migrateBotTypes() {
    await BunSQLite.sql({
        sql: `DELETE FROM bot_types WHERE bot_type = 'coordinator' OR bot_type = 'worker' OR workspace_id IS NULL`,
    });

    await BunSQLite.sql({
        sql: `UPDATE bot_types SET bot_type = 'workspace_admin', updated_at = ? WHERE bot_type = 'admin'`,
        values: [Date.now()],
    });
}
