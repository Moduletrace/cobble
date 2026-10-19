import { z } from "zod";
import grabCronJobs from "@/src/functions/backend/db/cron-jobs/grab-cron-jobs";
import describeCronJob from "@/src/utils/describe-cron-job";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
};

/**
 * Lets a bot see its own schedules, everywhere it works.
 */
export default function listSchedulesTool({ user_id, bot_id }: Params): HarnessTool<Record<string, never>> {
    return {
        name: "list_schedules",
        description: `List your schedules (routines): id, cron expression (UTC), where each runs, whether it's paused, its next run and its last error.`,
        schema: z.object({}),
        run: async () => {
            const cron_jobs = await grabCronJobs({ user_id, bot_id });

            if (!cron_jobs.length) return `You have no schedules.`;

            return cron_jobs.map((cron_job) => `- ${describeCronJob({ cron_job })}`).join("\n");
        },
    };
}
