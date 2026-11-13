import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotTraceJob } from "@/src/types";
import traceJobsFromRows from "./trace-jobs-from-rows";

type Params = {
    /**
     * A message the caller already checked the user reaches.
     */
    message_id: number;
};

type JobRow = {
    id: number;
    kind: string;
    title: string | null;
    status: string;
    created_at: number;
};

/**
 * The traces behind one bot message: what its run did, turn by turn, for
 * the debug logs tab of its Details modal. Usually one job (a reply or the
 * task run that reported back); a retried job that posted the same message
 * would list both.
 */
export default async function grabMessageTraces({ message_id }: Params): Promise<BotTraceJob[]> {
    const res = await BunSQLite.sql<JobRow>({
        sql: `SELECT q.id, q.kind, q.title, q.status, q.created_at
              FROM bot_job_traces t
              JOIN bots_queue q ON q.id = t.bots_queue_id
              WHERE t.message_id = ?
              GROUP BY q.id
              ORDER BY q.created_at DESC`,
        values: [message_id],
    });

    return traceJobsFromRows({ jobs: res.payload || [] });
}