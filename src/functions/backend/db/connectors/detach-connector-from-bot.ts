import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    connector_id: number | string;
};

/**
 * Takes a connector off one bot for this user: their own bot attachment,
 * and their own account given to this bot alone. A workspace's, the
 * install's or an account given to every bot is untouched, since they
 * reach here for reasons this user doesn't own.
 */
export default async function detachConnectorFromBot({ user_id, bot_id, connector_id }: Params) {
    await BunSQLite.sql({
        sql: `DELETE FROM bot_connectors WHERE bot_id = ? AND user_id = ? AND connector_id = ?`,
        values: [Number(bot_id), Number(user_id), Number(connector_id)],
    });

    await BunSQLite.sql({
        sql: `DELETE FROM connector_account_bots
            WHERE bot_id = ? AND account_id IN (
                SELECT id FROM connector_accounts
                WHERE connector_id = ? AND user_id = ? AND all_bots = 0
            )`,
        values: [Number(bot_id), Number(connector_id), Number(user_id)],
    });
}
