import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import AppError from "@/src/utils/app-error";

type Params = {
    job: Pick<BUN_SQLITE_COBBLE_BOTS_QUEUE, "session_id">;
};

/**
 * The session a job's result goes in. Every job is queued in one
 * (`enqueueBotJob`), which says whose conversation it is.
 */
export default function jobSessionId({ job }: Params) {
    if (!job.session_id) {
        throw new AppError(`This job has no conversation.`);
    }

    return Number(job.session_id);
}
