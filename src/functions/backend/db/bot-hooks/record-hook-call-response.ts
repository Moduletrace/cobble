import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import parseJobJson from "@/src/bots-queue/parse-job-json";
import { AppData } from "@/src/data/app-data";
import recordHookCallResponseSql from "./record-hook-call-response-sql";

type Params = {
    /**
     * The job that ended. Only a hook call's run (`params.hook_id`) has
     * calls to answer; any other job is left alone.
     */
    job: BUN_SQLITE_COBBLE_BOTS_QUEUE;
    status: "done" | "failed";
    /**
     * What the run answered, or why it failed. Cut to
     * `AppData.BotHookMaxPayloadBytes`.
     */
    response: string;
    /**
     * The chat message the run's end posted, if it posted one.
     */
    message_id?: number | string | null;
    now?: number;
};

/**
 * Keeps a hook run's end on the calls it took in, so they can be found
 * later by what was sent or answered, after the job itself is pruned.
 * Called wherever a job ends (completed, failed for good, lost, stopped,
 * cancelled). Never throws: the job has ended either way.
 */
export default async function recordHookCallResponse({ job, status, response, message_id, now = Date.now() }: Params) {
    const hook_id = Number(parseJobJson({ text: job.params })?.hook_id) || 0;

    if (!hook_id || !job.id) return;

    await BunSQLite.sql(
        recordHookCallResponseSql({
            hook_id,
            job_id: Number(job.id),
            status,
            response: response.slice(0, AppData.BotHookMaxPayloadBytes),
            message_id: Number(message_id) || null,
            now,
        }),
    ).catch(() => {});
}
