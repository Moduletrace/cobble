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
        /**
         * `updated_at` stands in for a row finished without a timestamp (an
         * older build, or a writer that set the status directly): without it
         * such a row sits in the queue for ever.
         */
        sql: `DELETE FROM bots_queue WHERE status IN ('completed', 'failed') AND COALESCE(finished_at, updated_at) < ? RETURNING id`,
        values: [cutoff],
    });

    return res;
}
