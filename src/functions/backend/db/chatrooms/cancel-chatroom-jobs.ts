import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import { abortRunningJob } from "@/src/bots-queue/job-abort-registry";

type Params = {
    chatroom_id: number | string;
    /**
     * Kept as each job's error.
     */
    reason: string;
    /**
     * The job closing the room (the coordinator's turn), which finishes on
     * its own.
     */
    except_job_id?: number | string | null;
};

/**
 * Fails every job in a room that could still run (pending or running),
 * stops the running ones here and now, and closes their tasks. The room
 * has its outcome already, so their results would go nowhere.
 */
export default async function cancelChatroomJobs({ chatroom_id, reason, except_job_id }: Params) {
    const now = Date.now();

    const cancelled =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS_QUEUE>({
                sql: `UPDATE bots_queue SET status = 'failed', last_error = ?, locked_at = NULL, locked_by = NULL, finished_at = ?, updated_at = ?
                    WHERE status IN ('pending', 'processing')
                    AND session_id IN (SELECT id FROM bot_sessions WHERE chatroom_id = ?)
                    AND id != ?
                    RETURNING *`,
                values: [reason, now, now, chatroom_id, Number(except_job_id) || 0],
            })
        ).payload || [];

    for (const job of cancelled) {
        abortRunningJob({ job_id: Number(job.id) });

        if (job.task_id) {
            await BunSQLite.sql({
                sql: `UPDATE bot_tasks SET status = 'done', updated_at = ? WHERE id = ?`,
                values: [now, Number(job.task_id)],
            });
        }
    }

    return cancelled;
}
