import { z } from "zod";
import deleteCronJob from "@/src/functions/backend/db/cron-jobs/delete-cron-job";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
};

type Args = {
    schedule_id: number;
};

/**
 * Lets a bot delete one of its own schedules.
 */
export default function deleteScheduleTool({ user_id, bot_id }: Params): HarnessTool<Args> {
    return {
        name: "delete_schedule",
        description: `Delete one of your schedules for good (ids from list_schedules). To stop it for a while, pause it with update_schedule instead.`,
        schema: z.object({
            schedule_id: z.number().int(),
        }),
        run: async ({ args }) => {
            const cron_job = await deleteCronJob({ user_id, bot_id, cron_job_id: args.schedule_id });

            return `Schedule #${cron_job.id} "${cron_job.title}" deleted.`;
        },
    };
}
