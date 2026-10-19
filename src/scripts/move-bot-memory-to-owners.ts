import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import grabBotUserMemory from "@/src/functions/backend/db/bots/grab-bot-user-memory";
import updateBotUserMemory from "@/src/functions/backend/db/bots/update-bot-user-memory";

/**
 * One-off: before `bot_user_memories`, bots saved what they learned about
 * their owner in their core memory (`bots.memory`), which every user they
 * work for would see. This moves each bot's core memory into its owner's
 * memory (after anything already there) and empties the core one.
 *
 * Run once per install: `bun src/scripts/move-bot-memory-to-owners.ts`.
 * Run again later it would move real core memory too.
 */
async function moveBotMemoryToOwners() {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
        sql: `SELECT id, user_id, memory FROM bots WHERE TRIM(COALESCE(memory, '')) != ''`,
    });

    const bots = res.payload || [];

    for (const bot of bots) {
        const existing = await grabBotUserMemory({ bot_id: bot.id!, user_id: bot.user_id! });
        const memory = [existing?.trim(), bot.memory!.trim()].filter(Boolean).join("\n\n");

        await updateBotUserMemory({ user_id: bot.user_id!, bot_id: bot.id!, memory });

        await BunSQLite.sql({
            sql: `UPDATE bots SET memory = '', updated_at = ? WHERE id = ?`,
            values: [Date.now(), bot.id!],
        });

        console.log(`Moved bot ${bot.id}'s memory to user ${bot.user_id}.`);
    }

    console.log(`Done: ${bots.length} bot(s).`);
}

await moveBotMemoryToOwners();
process.exit(0);
