import BunSQLite from "@moduletrace/bun-sqlite";
import { grabLogsKeepDays } from "@/src/functions/backend/db/app-settings/grab-logs-keep-days";

/**
 * Deletes logs older than the install's retention (`grabLogsKeepDays`).
 * Nothing points at a log, so no children go with them.
 */
export default async function pruneLogs() {
    const cutoff = Date.now() - (await grabLogsKeepDays()) * 24 * 60 * 60 * 1000;

    return await BunSQLite.sql({
        sql: `DELETE FROM logs WHERE created_at < ? RETURNING id`,
        values: [cutoff],
    });
}
