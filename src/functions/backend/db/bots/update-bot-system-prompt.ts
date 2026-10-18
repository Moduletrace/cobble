import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import assertPromptLength from "@/src/utils/assert-prompt-length";
import grabUserBot from "./grab-user-bot";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The whole new core instructions (markdown), replacing the old ones.
     */
    system_prompt: string;
};

/**
 * Replaces a bot's core instructions. The bot calls this to adapt how it
 * works to the user's workflow; the user can edit it too.
 */
export default async function updateBotSystemPrompt({
    user_id,
    bot_id,
    system_prompt,
}: Params) {
    if (!system_prompt.trim()) {
        throw new AppError(`A bot's core instructions can't be empty.`);
    }

    assertPromptLength({ label: "System prompt", text: system_prompt });

    const bot = await grabUserBot({ bot_id, user_id });

    if (!bot?.id) {
        throw new AppError(`Bot not found.`);
    }

    await BunSQLite.sql({
        sql: `UPDATE bots SET system_prompt = ?, updated_at = ? WHERE id = ?`,
        values: [system_prompt, Date.now(), bot.id],
    });
}
