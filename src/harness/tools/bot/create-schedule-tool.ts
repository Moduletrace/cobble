import { z } from "zod";
import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import createCronJob from "@/src/functions/backend/db/cron-jobs/create-cron-job";
import describeCronJob from "@/src/utils/describe-cron-job";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * Where the run is: the schedule runs there too.
     */
    workspace_id?: number | string | null;
    /**
     * The bot's computers where it runs, the current one first.
     */
    computers: BUN_SQLITE_COBBLE_COMPUTERS[];
};

type Args = {
    title: string;
    instructions: string;
    schedule: string;
    computer_id?: number;
    max_runs?: number;
};

/**
 * Lets a bot schedule work for itself (a routine, to the user): its brief
 * is queued as a task at every run, here, and the result posted in this
 * conversation.
 */
export default function createScheduleTool({ user_id, bot_id, workspace_id, computers }: Params): HarnessTool<Args> {
    const listed = computers.map((computer) => `${computer.id} (${computer.name || computer.kind})`).join(", ");

    return {
        name: "create_schedule",
        description: `Schedule work to run on its own, again and again or once (the user sees schedules as routines). At every run your instructions are queued as a task for you, ${
            workspace_id ? "in this workspace" : "in your own chat"
        }, and the result is posted here. The schedule is a cron expression in UTC: 5 fields (minute hour day-of-month month day-of-week, e.g. "0 9 * * MON-FRI" for 09:00 UTC on weekdays, "*/30 * * * *" every 30 minutes) or a nickname (@hourly, @daily, @weekly, @monthly). It's ${new Date().toISOString()} now. Convert the user's local time to UTC; if you don't know their time zone, ask, and remember it. At least ${Math.round(
            AppData.CronJobMinIntervalMs / 60000,
        )} minutes between runs. For a one-off, pin the date (e.g. "30 14 21 10 *") and set max_runs to 1. ${
            computers.length
                ? `Runs use the computer you're on when they start unless you pick one: ${listed}.`
                : `You have no computer here, so runs can't use one.`
        } Write the instructions as a full brief for a future you with no memory of this chat.`,
        schema: z.object({
            title: z.string().min(1).max(80).describe(`A short label, e.g. "Morning inbox digest"`),
            instructions: z.string().min(1).max(8000),
            schedule: z.string().min(1).max(100),
            computer_id: z.number().int().optional(),
            max_runs: z.number().int().positive().optional().describe("Stop after this many runs; leave out to run until stopped"),
        }),
        run: async ({ args }) => {
            const cron_job = await createCronJob({
                user_id,
                bot_id,
                workspace_id,
                title: args.title,
                instructions: args.instructions,
                schedule: args.schedule,
                computer_id: args.computer_id,
                max_runs: args.max_runs,
            });

            return `Schedule saved: ${describeCronJob({ cron_job })}. Tell the user when it runs, in their time, and that they can pause or change it under Routines.`;
        },
    };
}
