import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotTraceJob, BotTraceRow } from "@/src/types";

type JobRow = {
    id: number;
    kind: string;
    title: string | null;
    status: string;
    created_at: number;
};

type Params = {
    /**
     * The jobs whose trace rows are wanted, in the order they're shown.
     */
    jobs: JobRow[];
};

/**
 * Each job with every entry it kept, oldest entry first (the order the run
 * did them in). One read for all of them, so a session's handful of jobs
 * costs two queries rather than one per job.
 */
export default async function traceJobsFromRows({ jobs }: Params): Promise<BotTraceJob[]> {
    if (!jobs.length) return [];

    const traces =
        (
            await BunSQLite.sql<BotTraceRow>({
                sql: `SELECT id, created_at, bots_queue_id AS job_id, bot_id, kind, name, text, reasoning, arguments, result, metadata
              FROM bot_job_traces
              WHERE bots_queue_id IN (${jobs.map(() => "?").join(",")})
              ORDER BY id ASC`,
                values: jobs.map((job) => job.id),
            })
        ).payload || [];

    return jobs.map((job) => ({
        ...job,
        traces: traces.filter((row) => row.job_id == job.id),
    }));
}