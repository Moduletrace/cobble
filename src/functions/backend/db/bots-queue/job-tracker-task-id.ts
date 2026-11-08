import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import parseJobJson from "@/src/bots-queue/parse-job-json";

type Params = {
    job: Pick<BUN_SQLITE_COBBLE_BOTS_QUEUE, "params">;
};

/**
 * The tracker task a job was started for (`params.tracker_task_id`, set
 * by `handOverTask`), or null.
 */
export default function jobTrackerTaskId({ job }: Params): number | null {
    const id = Number(parseJobJson({ text: job.params })?.tracker_task_id || 0);

    return Number.isInteger(id) && id > 0 ? id : null;
}
