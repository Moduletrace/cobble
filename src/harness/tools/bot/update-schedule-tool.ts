import { z } from "zod";
import updateCronJob from "@/src/functions/backend/db/cron-jobs/update-cron-job";
import describeCronJob from "@/src/utils/describe-cron-job";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
};

type Args = {
    schedule_id: number;
    title?: string;
    instructions?: string;
    schedule?: string;
    enabled?: boolean;
    max_runs?: number | null;
};

/**
 * Lets a bot change, pause or resume one of its own schedules.
 */
export default function updateScheduleTool({ user_id, bot_id }: Params): HarnessTool<Args> {
    return {
        name: "update_schedule",
        description: `Change one of your schedules (ids from list_schedules): its title, instructions, cron expression (UTC), or pause it (enabled false) and resume it (enabled true). Only the fields you give change; max_runs null runs it until stopped.`,
        schema: z.object({
            schedule_id: z.number().int(),
            title: z.string().min(1).max(80).optional(),
            instructions: z.string().min(1).max(8000).optional(),
            schedule: z.string().min(1).max(100).optional(),
            enabled: z.boolean().optional(),
            max_runs: z.number().int().positive().nullable().optional(),
        }),
        run: async ({ args }) => {
            const { schedule_id, ...data } = args;
            const cron_job = await updateCronJob({ user_id, bot_id, cron_job_id: schedule_id, data });

            return `Schedule updated: ${describeCronJob({ cron_job })}.`;
        },
    };
}
