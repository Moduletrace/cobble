import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import pushBotUpdated from "@/src/bots-queue/push-bot-updated";

type Params = {
    /**
     * Unix ms: bots updated since then are pushed.
     */
    since: number;
    users: Set<string>;
};

/**
 * Pushes `server:bot-updated` (face, status line, the user's own active
 * task) for every bot that changed since `since` to the connected users
 * who see it (`pushBotUpdated`). Pushes are idempotent, so overlapping
 * windows only repeat them.
 */
export default async function relayChangedBots({ since, users }: Params) {
    if (!users.size) return;

    const bots =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
                sql: `SELECT id, face, status_line, computer_id FROM bots WHERE updated_at > ?`,
                values: [since],
            })
        ).payload || [];

    for (const bot of bots) {
        await pushBotUpdated({ bot, users });
    }
}
