import BunSQLite from "@moduletrace/bun-sqlite";
import { grabBotTraceKeepDays } from "@/src/functions/backend/db/app-settings/grab-bot-trace-keep-days";

/**
 * Deletes run traces (`bot_job_traces`, the conversation's debug view)
 * older than the install's retention (`grabBotTraceKeepDays`). Deleting a
 * job takes its traces with it (foreign keys), so this only takes what no
 * daily job prune would.
 */
export default async function pruneBotTraces() {
    const cutoff = Date.now() - (await grabBotTraceKeepDays()) * 24 * 60 * 60 * 1000;

    return await BunSQLite.sql({
        sql: `DELETE FROM bot_job_traces WHERE created_at < ? RETURNING id`,
        values: [cutoff],
    });
}