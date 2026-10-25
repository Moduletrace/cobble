import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    bot_id: number | string;
};

/**
 * Gives the coordinator its install-wide `coordinator` bot type, once.
 * The only place that type is ever written.
 */
export default async function ensureCoordinatorType({ bot_id }: Params) {
    await BunSQLite.sql({
        sql: `INSERT INTO bot_types (bot_id, bot_type, workspace_id, created_at, updated_at)
            SELECT ?, 'coordinator', NULL, ?, ? WHERE NOT EXISTS (
                SELECT 1 FROM bot_types WHERE bot_id = ? AND bot_type = 'coordinator' AND workspace_id IS NULL
            )`,
        values: [Number(bot_id), Date.now(), Date.now(), Number(bot_id)],
    });
}
