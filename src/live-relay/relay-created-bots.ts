import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import pushBotCreated from "@/src/bots-queue/push-bot-created";

type Params = {
    /**
     * Unix ms: bots created since then are pushed.
     */
    since: number;
    users: Set<string>;
};

/**
 * Pushes `server:bot-created` for every bot created since `since` to the
 * connected users who see it (`pushBotCreated`), so a bot another process
 * added still shows in the rail. Pushes are idempotent, so overlapping
 * windows only repeat them.
 */
export default async function relayCreatedBots({ since, users }: Params) {
    if (!users.size) return;

    const bots =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
                sql: `SELECT * FROM bots WHERE created_at > ?`,
                values: [since],
            })
        ).payload || [];

    for (const bot of bots) {
        await pushBotCreated({ bot, users });
    }
}
