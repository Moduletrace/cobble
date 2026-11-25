import { z } from "zod";
import updateCronJob from "@/src/functions/backend/db/cron-jobs/update-cron-job";
import describeCronJob from "@/src/utils/describe-cron-job";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The coordinator changes any of the user's routines, not only its own.
     */
    is_coordinator?: boolean;
    /**
     * The workspace the run is in: only a routine that runs there.
     */
    workspace_id?: number | string | null;
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
 * Lets a bot change, pause or resume one of its own schedules, or as the
 * coordinator any of the user's.
 */
export default function updateScheduleTool({ user_id, bot_id, is_coordinator, workspace_id }: Params): HarnessTool<Args> {
    return {
        name: "update_schedule",
        description: is_coordinator
            ? `Change one of the user's schedules, on any bot (ids from list_schedules): its title, instructions, cron expression (UTC), or pause it (enabled false) and resume it (enabled true). Only the fields you give change; max_runs null runs it until stopped.`
            : `Change one of your schedules (ids from list_schedules): its title, instructions, cron expression (UTC), or pause it (enabled false) and resume it (enabled true). Only the fields you give change; max_runs null runs it until stopped.`,
        schema: z.object({
            schedule_id: z.number().int(),
            title: z.string().min(1).max(80).optional(),
            instructions: z.string().min(1).max(8000).optional().describe("The brief every run follows, as its plan: the steps in order"),
            schedule: z.string().min(1).max(100).optional(),
            enabled: z.boolean().optional(),
            max_runs: z.number().int().positive().nullable().optional(),
        }),
        run: async ({ args }) => {
            const { schedule_id, ...data } = args;
            const cron_job = await updateCronJob({
                user_id,
                cron_job_id: schedule_id,
                ...(is_coordinator ? {} : { bot_id }),
                ...(workspace_id ? { workspace_id } : {}),
                data,
            });

            return `Schedule updated: ${describeCronJob({ cron_job, owner: is_coordinator ? cron_job.bot_name || undefined : undefined })}.`;
        },
    };
}