import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_USER_FACES, BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import pushBotUpdated from "@/src/bots-queue/push-bot-updated";

type Params = {
    /**
     * Unix ms: bots and faces updated since then are pushed.
     */
    since: number;
    users: Set<string>;
};

/**
 * Pushes `server:bot-updated` (the user's own face, status line and
 * active task) for every face that changed since `since` to the connected
 * user it's for, and for every bot that changed (e.g. its computer) to
 * the connected users who see it (`pushBotUpdated`). Pushes are
 * idempotent, so overlapping windows only repeat them.
 */
export default async function relayChangedBots({ since, users }: Params) {
    if (!users.size) return;

    const [faces, bots] = await Promise.all([
        BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_USER_FACES>({
            sql: `SELECT bot_id, user_id FROM bot_user_faces WHERE updated_at > ?`,
            values: [since],
        }),
        BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
            sql: `SELECT id, computer_id FROM bots WHERE updated_at > ?`,
            values: [since],
        }),
    ]);

    for (const face of faces.payload || []) {
        if (!face.bot_id || !face.user_id || !users.has(String(face.user_id))) continue;

        await pushBotUpdated({ bot_id: face.bot_id, user_id: face.user_id });
    }

    for (const bot of bots.payload || []) {
        if (!bot.id) continue;

        await pushBotUpdated({ bot_id: bot.id, users, computer_id: bot.computer_id || null });
    }
}
