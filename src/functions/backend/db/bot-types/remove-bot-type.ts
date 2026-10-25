import BunSQLite from "@moduletrace/bun-sqlite";
import logEvent from "@/src/functions/backend/logger";
import assertBotTypeChange, { type BotTypeChangeParams } from "./assert-bot-type-change";

/**
 * Takes a workspace type away from a bot. Taking one it doesn't have is a
 * no-op. Checked by `assertBotTypeChange`.
 */
export default async function removeBotType(params: BotTypeChangeParams) {
    const { bot, workspace } = await assertBotTypeChange({ ...params, action: "delete" });

    const res = await BunSQLite.sql({
        sql: `DELETE FROM bot_types WHERE bot_id = ? AND bot_type = ? AND workspace_id = ?`,
        values: [Number(bot.id), params.bot_type, Number(workspace.id)],
    });

    if (!res.success) {
        throw new Error(`Couldn't remove the bot's type: ${res.error}`);
    }

    await logEvent({
        title: `Bot type removed`,
        category: "system",
        user_id: Number(params.user_id),
        plain_text: `${bot.name} (#${bot.id}) is no longer ${params.bot_type} of ${workspace.name} (#${workspace.id})${params.actor_bot_id ? `, by bot #${params.actor_bot_id}` : ""}.`,
    }).catch(() => {});

    return { bot, workspace };
}
