import BunSQLite from "@moduletrace/bun-sqlite";
import { grabHookEventsKeepDays } from "@/src/functions/backend/db/app-settings/grab-hook-events-keep-days";

/**
 * Deletes hook calls (with their responses) older than the install's
 * retention (`grabHookEventsKeepDays`). The runs they queued and the
 * messages those posted stay.
 */
export default async function pruneBotHookEvents() {
    const cutoff = Date.now() - (await grabHookEventsKeepDays()) * 24 * 60 * 60 * 1000;

    return await BunSQLite.sql({
        sql: `DELETE FROM bot_hook_events WHERE created_at < ? RETURNING id`,
        values: [cutoff],
    });
}
