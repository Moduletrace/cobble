import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import type { BotTraceJob } from "@/src/types";
import traceJobsFromRows from "./trace-jobs-from-rows";

type Params = {
    session_id: number;
};

type JobRow = {
    id: number;
    kind: string;
    title: string | null;
    status: string;
    created_at: number;
};

/**
 * A session's traced jobs, newest first, each with everything it did in
 * detail: what the conversation's debug view streams while a run works and
 * what it lists when it's done. Read-only, and never more than
 * `AppData.BotTraceJobsPerSession` jobs.
 *
 * A job that's still open is listed even before its first step is kept, so
 * the live strip can say it's waiting on the bot rather than nothing being
 * there at all.
 */
export default async function grabSessionTraces({ session_id }: Params): Promise<BotTraceJob[]> {
    const res = await BunSQLite.sql<JobRow>({
        sql: `SELECT q.id, q.kind, q.title, q.status, q.created_at
              FROM bots_queue q
              WHERE q.id IN (
                  SELECT bots_queue_id FROM bot_job_traces WHERE session_id = ?
                  UNION
                  SELECT id FROM bots_queue WHERE session_id = ? AND status IN ('pending', 'processing')
              )
              ORDER BY q.created_at DESC
              LIMIT ?`,
        values: [session_id, session_id, AppData.BotTraceJobsPerSession],
    });

    return traceJobsFromRows({ jobs: res.payload || [] });
}