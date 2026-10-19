import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import assertPromptLength from "@/src/utils/assert-prompt-length";
import grabUserBot from "./grab-user-bot";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The whole new memory about this user (markdown), replacing the old one.
     */
    memory: string;
};

/**
 * Replaces what a bot remembers about one user. Only that user's runs see
 * it; the bot's core memory stays the same for everyone.
 */
export default async function updateBotUserMemory({
    user_id,
    bot_id,
    memory,
}: Params) {
    assertPromptLength({ label: "Memory", text: memory });

    const bot = await grabUserBot({ bot_id, user_id });

    if (!bot?.id) {
        throw new AppError(`Bot not found.`);
    }

    const now = Date.now();

    const res = await BunSQLite.sql({
        sql: `INSERT INTO bot_user_memories (created_at, updated_at, bot_id, user_id, memory)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(bot_id, user_id) DO UPDATE SET updated_at = excluded.updated_at, memory = excluded.memory`,
        values: [now, now, bot.id, user_id, memory],
    });

    if (!res.success) {
        throw new Error(`Couldn't save the bot's memory: ${res.error}`);
    }
}
