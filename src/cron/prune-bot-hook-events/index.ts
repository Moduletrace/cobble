import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";

/**
 * Deletes hook calls older than `AppData.BotHookEventsKeepDays`. The runs
 * they queued and their results stay.
 */
export default async function pruneBotHookEvents() {
    const cutoff = Date.now() - AppData.BotHookEventsKeepDays * 24 * 60 * 60 * 1000;

    return await BunSQLite.sql({
        sql: `DELETE FROM bot_hook_events WHERE created_at < ? RETURNING id`,
        values: [cutoff],
    });
}
