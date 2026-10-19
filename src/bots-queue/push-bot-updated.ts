import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import grabBotAudience from "@/src/functions/backend/db/access/grab-bot-audience";
import grabActiveBotTask from "@/src/functions/backend/db/bots/grab-active-bot-task";
import { sendToUser } from "@/src/websocket/(functions)/send-to-user";

type Params = {
    bot: Pick<BUN_SQLITE_COBBLE_BOTS, "id" | "face" | "status_line" | "computer_id">;
    /**
     * Only these users (the connected ones, for the live relay); else
     * everyone who sees the bot.
     */
    users?: Set<string>;
};

/**
 * Pushes `server:bot-updated` (face, status line, computer) to everyone
 * who sees the bot (`grabBotAudience`), each with their own active task
 * with it, never another user's.
 */
export default async function pushBotUpdated({ bot, users }: Params) {
    if (!bot.id) return;

    for (const user_id of await grabBotAudience({ bot_id: bot.id })) {
        if (users && !users.has(String(user_id))) continue;

        sendToUser({
            user_id,
            data: {
                event: "server:bot-updated",
                data: {
                    id: bot.id,
                    face: bot.face,
                    status_line: bot.status_line || "",
                    ...(bot.computer_id !== undefined ? { computer_id: bot.computer_id || null } : {}),
                    task: await grabActiveBotTask({ bot_id: bot.id, user_id }),
                },
            },
        });
    }
}
