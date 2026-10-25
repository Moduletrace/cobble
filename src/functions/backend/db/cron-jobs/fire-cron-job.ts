import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CRON_JOBS } from "@/db/types/db";
import wakeBotsQueue from "@/src/bots-queue/wake-bots-queue";
import logEvent, { logError } from "@/src/functions/backend/logger";
import nextCronRun from "@/src/utils/next-cron-run";
import safeErrorMessage from "@/src/utils/safe-error-message";
import ensureBotSession from "../bot-sessions/ensure-bot-session";
import enqueueBotJob from "../bots-queue/enqueue-bot-job";
import grabBotComputers from "../computers/grab-bot-computers";

type Params = {
    cron_job: BUN_SQLITE_COBBLE_CRON_JOBS;
    now?: number;
};

/**
 * Runs one due schedule: moves it to its next run (claimed atomically, so
 * a run is never queued twice), then queues its brief as a task in the
 * bot's active session there, on its computer or the bot's current one.
 * A run is skipped while the last one is still queued or working. It
 * turns itself off once it has no next run or has done its `max_runs`.
 * Why a run couldn't be queued is kept in `last_error`.
 */
export default async function fireCronJob({ cron_job, now = Date.now() }: Params) {
    const id = cron_job.id;
    const schedule = cron_job.schedule || "";

    if (!id || !cron_job.next_run_at) return;

    let next_run_at: number | null = null;

    try {
        next_run_at = nextCronRun({ schedule, from: now });
    } catch {}

    const claimed = await BunSQLite.sql<{ id: number }>({
        sql: `UPDATE cron_jobs SET next_run_at = ?, enabled = ?, updated_at = ?
            WHERE id = ? AND enabled = 1 AND next_run_at = ? RETURNING id`,
        values: [next_run_at, next_run_at ? 1 : 0, now, id, cron_job.next_run_at],
    });

    if (!claimed.payload?.[0]) return;

    try {
        if (cron_job.last_job_id && (await isJobOpen({ job_id: cron_job.last_job_id }))) {
            await saveRun({ id, last_error: `Skipped a run: the last one was still going.` });
            return;
        }

        const session = await ensureBotSession({
            user_id: cron_job.user_id!,
            bot_id: cron_job.bot_id!,
            workspace_id: cron_job.workspace_id || null,
        });

        const computer_id =
            cron_job.computer_id ||
            (
                await grabBotComputers({
                    bot_id: cron_job.bot_id!,
                    workspace_id: cron_job.workspace_id || null,
                })
            )[0]?.id;

        const job_id = await enqueueBotJob({
            user_id: cron_job.user_id!,
            bot_id: cron_job.bot_id!,
            session_id: session.id!,
            title: cron_job.title || "Scheduled task",
            instructions: `${cron_job.instructions || ""}\n\nThis is a scheduled run of your schedule #${id} (\`${schedule}\`, UTC). Do the work; don't create another schedule for it.`,
            params: { schedule_id: id, schedule, run: Number(cron_job.run_count || 0) + 1 },
            computer_id: computer_id || undefined,
        });

        const run_count = Number(cron_job.run_count || 0) + 1;
        const done = Boolean(cron_job.max_runs && run_count >= cron_job.max_runs);

        await saveRun({ id, last_run_at: now, last_job_id: Number(job_id), run_count, turn_off: done });

        wakeBotsQueue();

        await logEvent({
            title: `Schedule: ${cron_job.title}`,
            category: "cron",
            user_id: cron_job.user_id || undefined,
            plain_text: `Queued schedule #${id} "${cron_job.title}" (${schedule}) as job #${job_id}.`,
            metadata: { cron_job_id: id, job_id, bot_id: cron_job.bot_id },
        });
    } catch (error) {
        await saveRun({ id, last_error: safeErrorMessage({ error, fallback: `Couldn't queue the run.`, log: false }) });

        await logError({
            title: `Schedule #${id} couldn't run`,
            category: "cron",
            error,
            user_id: cron_job.user_id || undefined,
            metadata: { cron_job_id: id },
        }).catch(() => {});
    }
}

async function isJobOpen({ job_id }: { job_id: number }) {
    const res = await BunSQLite.sql({
        sql: `SELECT id FROM bots_queue WHERE id = ? AND status IN ('pending', 'processing') LIMIT 1`,
        values: [job_id],
    });

    return Boolean(res.payload?.[0]);
}

async function saveRun({
    id,
    last_run_at,
    last_job_id,
    run_count,
    turn_off,
    last_error = null,
}: {
    id: number;
    last_run_at?: number;
    last_job_id?: number;
    run_count?: number;
    turn_off?: boolean;
    last_error?: string | null;
}) {
    await BunSQLite.sql({
        sql: `UPDATE cron_jobs SET
                last_run_at = COALESCE(?, last_run_at),
                last_job_id = COALESCE(?, last_job_id),
                run_count = COALESCE(?, run_count),
                enabled = CASE WHEN ? THEN 0 ELSE enabled END,
                last_error = ?,
                updated_at = ?
            WHERE id = ?`,
        values: [
            last_run_at ?? null,
            last_job_id ?? null,
            run_count ?? null,
            turn_off ? 1 : 0,
            last_error,
            Date.now(),
            id,
        ],
    });
}
