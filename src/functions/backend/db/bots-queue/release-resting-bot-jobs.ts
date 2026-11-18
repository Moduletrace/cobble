import BunSQLite from "@moduletrace/bun-sqlite";
import { ReleaseRestingBotJobsSql } from "./release-resting-bot-jobs-sql";

/**
 * Puts every pending job a model rest parked ahead of time back in the queue
 * now, and returns how many woke.
 *
 * Called where the benches they waited on stop existing: when the run limits
 * (and with them the model rest) are saved, and when the queue starts, since
 * the cooldowns are in memory and a restart forgets them. Without this the
 * job sleeps until its day-long `available_at` cap with nothing left to wait
 * for, and the bot shows "Waiting for a free model" over a stopped queue.
 */
export default async function releaseRestingBotJobs() {
    const now = Date.now();

    const res = await BunSQLite.sql({
        sql: ReleaseRestingBotJobsSql,
        values: [now, now, now],
    });

    return res.payload?.length || 0;
}