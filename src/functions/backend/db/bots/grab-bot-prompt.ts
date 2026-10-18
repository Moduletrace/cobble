import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import composeBotPrompt from "@/src/utils/compose-bot-prompt";
import AppError from "@/src/utils/app-error";
import grabUserBot from "./grab-user-bot";

type Params = {
    bot_id: number | string;
    user_id: number | string;
};

/**
 * The full prompt for one of the user's bots: its core instructions, the
 * system prompt of every non-archived workspace it's in, and its memory.
 */
export default async function grabBotPrompt({ bot_id, user_id }: Params) {
    const bot = await grabUserBot({ bot_id, user_id });

    if (!bot?.id) {
        throw new AppError(`Bot not found.`);
    }

    const workspaces =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACES>({
                sql: `SELECT w.name, w.system_prompt FROM workspaces w
                    JOIN workspace_bots wb ON wb.workspace_id = w.id
                    WHERE wb.bot_id = ? AND w.user_id = ? AND w.archived = 0
                    ORDER BY w.id ASC`,
                values: [bot.id, user_id],
            })
        ).payload || [];

    return composeBotPrompt({
        system_prompt: bot.system_prompt,
        memory: bot.memory,
        workspaces,
    });
}
