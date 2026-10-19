import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import grabActiveBotTask from "@/src/functions/backend/db/bots/grab-active-bot-task";
import type { BotUpdatedData } from "@/src/types";
import { sendToUser } from "@/src/websocket/(functions)/send-to-user";

type Params = {
    /**
     * Unix ms: bots updated since then are pushed.
     */
    since: number;
    users: Set<string>;
};

/**
 * Pushes `server:bot-updated` (face, status line, active task) for every
 * bot of a connected user that changed since `since`. Pushes are
 * idempotent, so overlapping windows only repeat them.
 */
export default async function relayChangedBots({ since, users }: Params) {
    if (!users.size) return;

    const ids = [...users];

    const bots =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
                sql: `SELECT id, user_id, face, status_line, computer_id FROM bots
                    WHERE updated_at > ? AND user_id IN (${ids.map(() => "?").join(", ")})`,
                values: [since, ...ids],
            })
        ).payload || [];

    for (const bot of bots) {
        if (!bot.id || !bot.user_id) continue;

        const data: BotUpdatedData = {
            id: bot.id,
            face: bot.face,
            status_line: bot.status_line || "",
            task: await grabActiveBotTask({ bot_id: bot.id }),
            computer_id: bot.computer_id || null,
        };

        sendToUser({ user_id: bot.user_id, data: { event: "server:bot-updated", data } });
    }
}
