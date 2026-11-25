import { z } from "zod";
import deleteCronJob from "@/src/functions/backend/db/cron-jobs/delete-cron-job";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The coordinator deletes any of the user's routines, not only its own.
     */
    is_coordinator?: boolean;
    /**
     * The workspace the run is in: only a routine that runs there.
     */
    workspace_id?: number | string | null;
};

type Args = {
    schedule_id: number;
};

/**
 * Lets a bot delete one of its own schedules, or as the coordinator any of
 * the user's.
 */
export default function deleteScheduleTool({ user_id, bot_id, is_coordinator, workspace_id }: Params): HarnessTool<Args> {
    return {
        name: "delete_schedule",
        description: is_coordinator
            ? `Delete one of the user's schedules for good, on any bot (ids from list_schedules). To stop it for a while, pause it with update_schedule instead.`
            : `Delete one of your schedules for good (ids from list_schedules). To stop it for a while, pause it with update_schedule instead.`,
        schema: z.object({
            schedule_id: z.number().int(),
        }),
        run: async ({ args }) => {
            const cron_job = await deleteCronJob({
                user_id,
                cron_job_id: args.schedule_id,
                ...(is_coordinator ? {} : { bot_id }),
                ...(workspace_id ? { workspace_id } : {}),
            });

            return `Schedule #${cron_job.id} "${cron_job.title}" deleted.`;
        },
    };
}