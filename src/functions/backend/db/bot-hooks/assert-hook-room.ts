import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import AppError from "@/src/utils/app-error";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    bot_name?: string | null;
};

/**
 * Throws when the user's hooks for this bot are at
 * `AppData.BotHookMaxPerBot`.
 */
export default async function assertHookRoom({ user_id, bot_id, bot_name }: Params) {
    const count = Number(
        (
            await BunSQLite.sql<{ n: number }>({
                sql: `SELECT COUNT(*) AS n FROM bot_hooks WHERE bot_id = ? AND user_id = ?`,
                values: [bot_id, user_id],
            })
        ).payload?.[0]?.n || 0,
    );

    if (count >= AppData.BotHookMaxPerBot) {
        throw new AppError(`${bot_name || "This bot"} already has ${AppData.BotHookMaxPerBot} hooks. Delete one first.`);
    }
}
