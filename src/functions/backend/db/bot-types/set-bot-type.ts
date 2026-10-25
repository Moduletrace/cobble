import BunSQLite from "@moduletrace/bun-sqlite";
import logEvent from "@/src/functions/backend/logger";
import assertBotTypeChange, { type BotTypeChangeParams } from "./assert-bot-type-change";

/**
 * Gives a bot a workspace type (makes it admin of a workspace it works
 * in). Giving it again is a no-op. Checked by `assertBotTypeChange`.
 */
export default async function setBotType(params: BotTypeChangeParams) {
    const { bot, workspace } = await assertBotTypeChange({ ...params, action: "assign" });

    const existing = await BunSQLite.sql<{ id: number }>({
        sql: `SELECT id FROM bot_types WHERE bot_id = ? AND bot_type = ? AND workspace_id = ? LIMIT 1`,
        values: [Number(bot.id), params.bot_type, Number(workspace.id)],
    });

    if (existing.payload?.[0]?.id) return { bot, workspace, changed: false };

    const res = await BunSQLite.sql({
        sql: `INSERT INTO bot_types (bot_id, bot_type, workspace_id, granted_by_user_id, granted_by_bot_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
        values: [
            Number(bot.id),
            params.bot_type,
            Number(workspace.id),
            Number(params.user_id),
            params.actor_bot_id ? Number(params.actor_bot_id) : null,
            Date.now(),
            Date.now(),
        ],
    });

    if (!res.success) {
        throw new Error(`Couldn't save the bot's type: ${res.error}`);
    }

    await logEvent({
        title: `Bot type given`,
        category: "system",
        user_id: Number(params.user_id),
        plain_text: `${bot.name} (#${bot.id}) is now ${params.bot_type} of ${workspace.name} (#${workspace.id})${params.actor_bot_id ? `, by bot #${params.actor_bot_id}` : ""}.`,
    }).catch(() => {});

    return { bot, workspace, changed: true };
}
