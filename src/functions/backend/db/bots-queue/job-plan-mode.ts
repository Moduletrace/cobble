import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import parseJobJson from "@/src/bots-queue/parse-job-json";

type Params = {
    job: Pick<BUN_SQLITE_COBBLE_BOTS_QUEUE, "params">;
};

/**
 * The reply behind a job ran in Plan mode (`params.plan_mode`, set from the
 * user's message or a card asked in it). Its answer is recorded with the
 * flag, so the thread can offer to leave the mode under it.
 */
export default function jobPlanMode({ job }: Params): boolean {
    return Boolean(parseJobJson({ text: job.params })?.plan_mode);
}