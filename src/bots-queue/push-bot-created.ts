import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import type { BotWithLastMessage } from "@/src/types";
import grabBotAudience from "@/src/functions/backend/db/access/grab-bot-audience";
import isBotInOwnChat from "@/src/functions/backend/db/bots/is-bot-in-own-chat";
import { sendToUser } from "@/src/websocket/(functions)/send-to-user";

type Params = {
    bot: BUN_SQLITE_COBBLE_BOTS;
    /**
     * Only these users (the connected ones, for the live relay); else
     * everyone who sees the bot.
     */
    users?: Set<string>;
};

/**
 * Pushes `server:bot-created` to everyone who sees a bot that just joined
 * the crew or a workspace: its rail row, the workspaces it's in, and
 * whether it also belongs in that user's own chat list.
 */
export default async function pushBotCreated({ bot, users }: Params) {
    if (!bot.id) return;

    const bot_id = Number(bot.id);

    const workspace_ids = (
        (
            await BunSQLite.sql<{ workspace_id: number }>({
                sql: `SELECT workspace_id FROM workspace_bots WHERE bot_id = ?`,
                values: [bot_id],
            })
        ).payload || []
    ).map((row) => Number(row.workspace_id));

    const data: BotWithLastMessage = {
        ...bot,
        unread: 0,
        last_activity_at: null,
        last_message_text: null,
        last_message_at: null,
    };

    for (const user_id of await grabBotAudience({ bot_id })) {
        if (users && !users.has(String(user_id))) continue;

        sendToUser({
            user_id,
            data: {
                event: "server:bot-created",
                data: {
                    bot: data,
                    workspace_ids,
                    in_own_chat: await isBotInOwnChat({ bot_id, user_id }),
                },
            },
        });
    }
}
