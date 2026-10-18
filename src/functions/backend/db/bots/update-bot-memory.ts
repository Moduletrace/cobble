import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import assertPromptLength from "@/src/utils/assert-prompt-length";
import grabUserBot from "./grab-user-bot";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The whole new memory (markdown), replacing the old one.
     */
    memory: string;
};

/**
 * Replaces a bot's memory. The bot calls this as it learns what it must
 * keep in mind; the user can edit it too.
 */
export default async function updateBotMemory({
    user_id,
    bot_id,
    memory,
}: Params) {
    assertPromptLength({ label: "Memory", text: memory });

    const bot = await grabUserBot({ bot_id, user_id });

    if (!bot?.id) {
        throw new AppError(`Bot not found.`);
    }

    await BunSQLite.sql({
        sql: `UPDATE bots SET memory = ?, updated_at = ? WHERE id = ?`,
        values: [memory, Date.now(), bot.id],
    });
}
