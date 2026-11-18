import BunSQLite from "@moduletrace/bun-sqlite";
import detachHookSessions from "@/src/functions/backend/db/bot-hooks/detach-hook-sessions";
import { grabHookEventsKeepDays } from "@/src/functions/backend/db/app-settings/grab-hook-events-keep-days";

/**
 * Deletes hook calls older than the install's retention
 * (`grabHookEventsKeepDays`) and lets go of the sessions of hooks that are
 * gone. The messages those calls left in a hook's thread stay: it's the
 * user's own session now, read and chatted in like any other.
 */
export default async function pruneBotHookEvents() {
    const cutoff = Date.now() - (await grabHookEventsKeepDays()) * 24 * 60 * 60 * 1000;

    await detachHookSessions({});

    return await BunSQLite.sql({
        sql: `DELETE FROM bot_hook_events WHERE created_at < ? RETURNING id`,
        values: [cutoff],
    });
}
