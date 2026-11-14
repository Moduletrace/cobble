import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import { abortRunningJob } from "@/src/bots-queue/job-abort-registry";

type Params = {
    ask_id: number | string;
    reason: string;
    /**
     * The job whose own end is being recorded: it isn't cancelled.
     */
    except_job_id?: number | string | null;
};

/**
 * Fails every job still open for an ask, whoever's bot it is (the gate's
 * review or the asked bot's answer), and aborts the handler if this process
 * runs it. Their tasks are closed too.
 */
export default async function cancelAskJobs({ ask_id, reason, except_job_id }: Params) {
    const now = Date.now();

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS_QUEUE>({
        sql: `UPDATE bots_queue SET status = 'failed', last_error = ?, locked_at = NULL, locked_by = NULL,
                finished_at = ?, updated_at = ?
            WHERE status IN ('pending', 'processing') AND id != ?
                AND session_id IN (SELECT id FROM bot_sessions WHERE ask_id = ?)
            RETURNING *`,
        values: [reason, now, now, Number(except_job_id) || 0, Number(ask_id)],
    });

    const jobs = res.payload || [];

    for (const job of jobs) {
        abortRunningJob({ job_id: Number(job.id) });

        if (job.task_id) {
            await BunSQLite.sql({
                sql: `UPDATE bot_tasks SET status = 'done', updated_at = ? WHERE id = ?`,
                values: [now, Number(job.task_id)],
            });
        }
    }

    return jobs;
}
