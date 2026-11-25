import { z } from "zod";
import grabCronJobs from "@/src/functions/backend/db/cron-jobs/grab-cron-jobs";
import botRef from "@/src/utils/bot-ref";
import describeCronJob from "@/src/utils/describe-cron-job";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    /**
     * The coordinator reaches every bot the user has, so it lists the whole
     * crew's routines, not only its own.
     */
    is_coordinator?: boolean;
    /**
     * The workspace the run is in: then only the routines that run there,
     * never another workspace's nor the bots' own chat.
     */
    workspace_id?: number | string | null;
};

type Args = {
    bot_id?: number;
};

/**
 * Lets a bot see its own schedules, everywhere it works. The coordinator
 * sees the crew's, each naming the bot that runs it. In a workspace only
 * that workspace's routines are in reach.
 */
export default function listSchedulesTool({ user_id, bot_id, is_coordinator, workspace_id }: Params): HarnessTool<Args> {
    return {
        name: "list_schedules",
        description: is_coordinator
            ? `${workspace_id ? "List the schedules (routines) that run in this workspace, on any of its bots" : "List the schedules (routines) of every bot the user has"}: id, cron expression (UTC), which bot runs it, where, whether it's paused, its next run and its last error. Pass bot_id to see only one bot's. This is a list, not a census of the install: give what it holds and never conclude from it that a routine does not exist.`
            : `List ${workspace_id ? "the schedules (routines) that run in this workspace" : "your own schedules (routines)"}: id, cron expression (UTC), where each runs, whether it's paused, its next run and its last error.${workspace_id ? " Nothing outside this workspace is in reach." : " Only yours: another bot's routines are not in this list, so never say the user has no routine from it, since they may have one on another bot."}`,
        schema: is_coordinator
            ? z.object({
                  bot_id: z.number().int().positive().optional().describe("Only this bot's schedules"),
              })
            : z.strictObject({}),
        run: async ({ args }) => {
            const cron_jobs = await grabCronJobs({
                user_id,
                ...(is_coordinator
                    ? { ...(args.bot_id ? { bot_id: args.bot_id } : {}), ...(workspace_id ? { workspace_id } : {}) }
                    : { bot_id, ...(workspace_id ? { workspace_id } : {}) }),
            });

            if (!cron_jobs.length) {
                if (is_coordinator) {
                    if (args.bot_id) return `Bot ${botRef({ id: args.bot_id })} has no schedules${workspace_id ? " in this workspace" : ""}.`;

                    return workspace_id ? `There are no schedules in this workspace.` : `The user's crew has no schedules.`;
                }

                return workspace_id
                    ? `There are no schedules in this workspace. Routines elsewhere aren't in this list.`
                    : `You have no schedules of your own. Other bots' routines aren't in this list.`;
            }

            return cron_jobs
                .map((cron_job) =>
                    is_coordinator
                        ? `- ${botRef({ id: Number(cron_job.bot_id) })} ${cron_job.bot_name}: ${describeCronJob({ cron_job, owner: cron_job.bot_name || undefined })}`
                        : `- ${describeCronJob({ cron_job })}`,
                )
                .join("\n");
        },
    };
}