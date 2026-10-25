import { z } from "zod";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import handOverCronJob from "@/src/functions/backend/db/cron-jobs/hand-over-cron-job";
import grabUserCronJob from "@/src/functions/backend/db/cron-jobs/grab-user-cron-job";
import grabCrewWorkers from "@/src/functions/backend/db/bots/grab-crew-workers";
import describeCronJob from "@/src/utils/describe-cron-job";
import handOverPlace from "@/src/utils/hand-over-place";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The bot handing its routine over (the coordinator, or a workspace's
     * admin).
     */
    bot_id: number | string;
    /**
     * The workspace the run is in: only routines that run there can be
     * handed over, and they stay there.
     */
    workspace_id?: number | string | null;
    requester_name: string;
    /**
     * The bots it can hand routines to (in a workspace, its members).
     */
    workers: BUN_SQLITE_COBBLE_BOTS[];
    /**
     * Reads who it may hand to when it does, as `delegate_task` does.
     */
    grabTargets?: (params: { workspace_id: number | null }) => Promise<BUN_SQLITE_COBBLE_BOTS[]>;
    /**
     * The user's live workspaces, for a routine of the bot's own chat.
     */
    workspaces?: BUN_SQLITE_COBBLE_WORKSPACES[];
};

type Args = {
    schedule_id: number;
    bot_id: number;
    workspace_id?: number;
};

/**
 * Lets the coordinator or a workspace admin give one of its own routines
 * to a crew member (`handOverCronJob`): a routine in a workspace keeps
 * running there, one in its own chat moves to the member's own chat or a
 * workspace it names.
 */
export default function handOverScheduleTool({
    user_id,
    bot_id,
    workspace_id,
    requester_name,
    workers,
    workspaces = [],
    grabTargets = ({ workspace_id }) => grabCrewWorkers({ workspace_id }),
}: Params): HarnessTool<Args> {
    const crew = workers.map((bot) => `${bot.id}: ${bot.name}`).join("; ");
    const places = workspaces.map((w) => `${w.id}: ${w.name}`).join("; ");

    return {
        name: "hand_over_schedule",
        description: `Give one of your own schedules (routines, list_schedules) to a crew member: from then on it runs as theirs, on the same schedule, and its results land in their conversation. Use it instead of deleting a schedule and asking them to make a new one. A schedule that runs in a workspace keeps running there.${
            workspace_id
                ? ` You are in a workspace, so only the schedules that run here can be handed over.`
                : ` For one that runs in your own chat, leave workspace_id out to move it to the crew member's own chat, or add it to run it in one of the user's workspaces (the member is added to it when it isn't in it yet). Workspaces: ${places || "none"}.`
        } Crew: ${crew}.`,
        schema: z.object({
            schedule_id: z.number().int(),
            bot_id: z.number().int(),
            workspace_id: z
                .number()
                .int()
                .optional()
                .describe("For a schedule of your own chat: the workspace it runs in from now on"),
        }),
        run: async ({ args }) => {
            const cron_job = await grabUserCronJob({ user_id, cron_job_id: args.schedule_id, bot_id });

            if (workspace_id && Number(cron_job.workspace_id || 0) != Number(workspace_id)) {
                throw new Error(`Schedule #${cron_job.id} doesn't run in this workspace. Only the ones that run here can be handed over from here.`);
            }

            const target_workspace_id = handOverPlace({
                workspace_id: cron_job.workspace_id,
                asked_workspace_id: workspace_id || args.workspace_id,
                label: `Schedule #${cron_job.id}`,
            });

            const fresh = await grabTargets({ workspace_id: workspace_id ? Number(workspace_id) : target_workspace_id });
            const worker = fresh.find((bot) => bot.id == args.bot_id);

            if (!worker?.id) {
                throw new Error(
                    `No crew member has id ${args.bot_id}. Crew: ${fresh.map((bot) => `${bot.id}: ${bot.name}`).join("; ") || "none"}.`,
                );
            }

            const handed = await handOverCronJob({
                user_id,
                cron_job_id: Number(cron_job.id),
                from_bot_id: bot_id,
                to_bot_id: Number(worker.id),
                workspace_id: args.workspace_id,
                handed_by: requester_name,
            });

            return `Handed over to ${worker.name}: ${describeCronJob({ cron_job: handed.cron_job })}.${handed.joined}${
                handed.computer_dropped ? ` Its computer isn't one ${worker.name} reaches there, so it runs on their default one.` : ""
            }`;
        },
    };
}
