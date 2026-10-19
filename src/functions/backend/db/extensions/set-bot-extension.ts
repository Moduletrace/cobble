import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import assertBotExtensionManager from "./assert-bot-extension-manager";
import { ExtensionTables, type ExtensionKind } from "./extension-tables";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    kind: ExtensionKind;
    id: number;
    /**
     * Gives it to the bot, or takes it away.
     */
    attached: boolean;
};

/**
 * Gives a bot an MCP server or tool, or takes it away, even one set to
 * "every bot" (that only decides what bots start with). What its
 * workspaces have stays theirs. Returns the bot and the item's name.
 */
export default async function setBotExtension({ user_id, bot_id, kind, id, attached }: Params) {
    const bot = await assertBotExtensionManager({ user_id, bot_id });
    const { table, bot_link, column, label } = ExtensionTables[kind];

    const item = (
        await BunSQLite.sql<{ id: number; name: string }>({ sql: `SELECT id, name FROM ${table} WHERE id = ?`, values: [id] })
    ).payload?.[0];

    if (!item) throw new AppError(`That ${label} doesn't exist.`);

    const now = Date.now();
    const res = attached
        ? await BunSQLite.sql({
              sql: `INSERT OR IGNORE INTO ${bot_link} (created_at, updated_at, bot_id, ${column}) VALUES (?, ?, ?, ?)`,
              values: [now, now, bot.id, id],
          })
        : await BunSQLite.sql({
              sql: `DELETE FROM ${bot_link} WHERE bot_id = ? AND ${column} = ?`,
              values: [bot.id, id],
          });

    if (!res.success) throw new Error(`Couldn't change the bot's ${label}s: ${res.error}`);

    return { bot, name: item.name };
}
