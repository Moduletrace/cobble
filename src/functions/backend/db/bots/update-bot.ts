import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotHue } from "@/src/dict/bot-dict";
import AppError from "@/src/utils/app-error";
import assertPromptLength from "@/src/utils/assert-prompt-length";
import grabUserBot from "./grab-user-bot";
import assertCrewManager from "@/src/functions/backend/db/access/assert-crew-manager";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    name: string;
    role?: string;
    hue: BotHue;
    system_prompt: string;
};

/**
 * Saves one of the user's bots: name, job, hue and core instructions. The
 * coordinator keeps its name and stays hue-less, so only its instructions
 * change. Returns the saved bot.
 */
export default async function updateBot({ user_id, bot_id, name, role, hue, system_prompt }: Params) {
    await assertCrewManager({ user_id });

    assertPromptLength({ label: "Instructions", text: system_prompt });

    const bot = await grabUserBot({ bot_id, user_id });

    if (!bot?.id) {
        throw new AppError(`Bot not found.`);
    }

    if (bot.kind == "coordinator") {
        await BunSQLite.sql({
            sql: `UPDATE bots SET system_prompt = ?, updated_at = ? WHERE id = ?`,
            values: [system_prompt, Date.now(), bot.id],
        });
    } else {
        await BunSQLite.sql({
            sql: `UPDATE bots SET name = ?, role = ?, hue = ?, system_prompt = ?, updated_at = ? WHERE id = ?`,
            values: [name, role || null, hue, system_prompt, Date.now(), bot.id],
        });
    }

    return (await grabUserBot({ bot_id, user_id }))!;
}
