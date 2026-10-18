import bunext from "@moduletrace/bunext";
import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";

/**
 * Deletes finished jobs (completed, failed or cancelled) older than
 * `AppData.BotQueueRetentionDays`. Their messages stay in the conversation.
 */
export default async function pruneBotsQueue() {
    const cutoff =
        Date.now() - AppData.BotQueueRetentionDays * 24 * 60 * 60 * 1000;

    const res = await BunSQLite.sql({
        sql: `DELETE FROM bots_queue WHERE status IN ('completed', 'failed') AND finished_at IS NOT NULL AND finished_at < ? RETURNING id`,
        values: [cutoff],
    });

    bunext.bunextLog.info(
        `Cron: pruned ${res.payload?.length || 0} finished bot job(s)`,
    );

    return res;
}
