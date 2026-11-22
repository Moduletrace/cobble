import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabUserBot from "../bots/grab-user-bot";
import grabConnector from "./grab-connector";
import syncConnector from "./sync-connector";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    connector_id: number | string;
    /**
     * Shows it in the user's runs on the bot, or takes it away.
     */
    attached: boolean;
};

/**
 * A user's own attachment of a connector to a bot: it shows in their runs
 * there and in nobody else's. Shared reach is a workspace or global
 * connector, which only a super admin sets.
 */
export default async function setBotConnector({ user_id, bot_id, connector_id, attached }: Params) {
    const [bot, connector] = await Promise.all([
        grabUserBot({ bot_id, user_id }),
        grabConnector({ connector_id }),
    ]);

    if (!bot) throw new AppError(`You don't reach that bot.`);

    const now = Date.now();
    const res = attached
        ? await BunSQLite.sql({
              sql: `INSERT OR IGNORE INTO bot_connectors (created_at, updated_at, bot_id, user_id, connector_id) VALUES (?, ?, ?, ?, ?)`,
              values: [now, now, Number(bot.id), Number(user_id), connector.id],
          })
        : await BunSQLite.sql({
              sql: `DELETE FROM bot_connectors WHERE bot_id = ? AND user_id = ? AND connector_id = ?`,
              values: [Number(bot.id), Number(user_id), connector.id],
          });

    if (!res.success) throw new Error(`Couldn't change the bot's connectors: ${res.error}`);

    if (attached && !connector.tools.length) await syncConnector({ connector_id: connector.id });

    return { bot, connector };
}