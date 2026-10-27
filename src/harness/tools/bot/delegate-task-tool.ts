import { z } from "zod";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import enqueueBotJob from "@/src/functions/backend/db/bots-queue/enqueue-bot-job";
import grabOpenBotTask from "@/src/functions/backend/db/bots-queue/grab-open-bot-task";
import ensureBotInWorkspace from "@/src/functions/backend/db/workspaces/ensure-bot-in-workspace";
import grabRunTask from "@/src/functions/backend/db/tasks/grab-run-task";
import handOverTask from "@/src/functions/backend/db/tasks/hand-over-task";
import insertBotMessage from "@/src/functions/backend/db/bots/insert-bot-message";
import grabCrewWorkers from "@/src/functions/backend/db/bots/grab-crew-workers";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import ensureBotSession from "@/src/functions/backend/db/bot-sessions/ensure-bot-session";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The bot handing the work over (the coordinator, or a workspace's
     * admin): the worker's result comes back to its conversation.
     */
    requester_id: number | string;
    /**
     * The requester's session the task is handed over from.
     */
    session_id: number | string;
    /**
     * The workspace the requester is working in: the worker works on it
     * there, in its conversation in the workspace.
     */
    workspace_id?: number | string | null;
    /**
     * The requester's name, shown in the worker's conversation.
     */
    requester_name: string;
    /**
     * The worker bots it can hand work to (in a workspace, its members).
     */
    workers: BUN_SQLITE_COBBLE_BOTS[];
    /**
     * Reads who it may hand work to when the task is handed over, so a bot
     * added earlier in the run is there. `grabCrewWorkers` by default (the
     * coordinator); a workspace admin's are `grabDirectableBots`.
     */
    grabTargets?: (params: { workspace_id: number | null }) => Promise<BUN_SQLITE_COBBLE_BOTS[]>;
    /**
     * The user's live workspaces, for the picker. In a workspace there's
     * nothing to pick: the task runs there.
     */
    workspaces?: BUN_SQLITE_COBBLE_WORKSPACES[];
    /**
     * The requester's reach over the task tracker (`grabBotRunPowers`), so
     * `task_id` only hands over a task its run reaches.
     */
    is_coordinator?: boolean;
    admin_workspace_ids?: number[];
};

type Args = {
    bot_id: number;
    /**
     * A task already on a list (`list_tasks`) to hand over instead of a
     * new brief: it moves to the worker (or stays on its workspace's list)
     * and the worker works that same task.
     */
    task_id?: number;
    title?: string;
    instructions?: string;
    /**
     * The workspace the worker runs the task in, from the coordinator's own
     * chat. Left out, the worker runs it in its own chat, on its own
     * memory and its direct computers only.
     */
    workspace_id?: number;
};

/**
 * Lets the coordinator hand a task to a worker bot: in its own chat, or in
 * one of the user's workspaces, which decides the work's context entirely.
 * A workspace admin gets it too, for the workers in its workspace.
 * The worker runs it on the computer it's on there (if it has one) and
 * posts the result in that conversation, where a note says who asked; the
 * result (or failure) is also reported back in the coordinator's
 * conversation. Given a `task_id`, it hands over a task already on a list
 * instead (`handOverTask`): the worker works that same task.
 */
export default function delegateTaskTool({
    user_id,
    requester_id,
    session_id,
    workspace_id,
    requester_name,
    workers,
    workspaces = [],
    grabTargets = ({ workspace_id }) => grabCrewWorkers({ workspace_id }),
    is_coordinator = false,
    admin_workspace_ids = [],
}: Params): HarnessTool<Args> {
    const crew = workers
        .map((bot) => `${bot.id}: ${bot.name}${bot.role ? ` (${bot.role})` : ""}`)
        .join("; ");
    const places = workspaces
        .map((w) => `${w.id}: ${w.name}`)
        .join("; ");

    return {
        name: "delegate_task",
        description: `Hand a task to a crew member. They run it in the background and post the result in their own conversation; it's also reported back here when they finish or fail. Write the instructions as a full brief: what to do, where, and how they'll know it's done. To hand over a task already on a list (list_tasks), pass its task_id instead of writing a new one: it moves to the crew member's list (a workspace's task stays on the workspace's list and runs there), goes to doing, and they work that same task; title and instructions are then optional, the task's brief is used and yours is added to it. Crew: ${crew}.${
            workspace_id
                ? ` You are working in a workspace, so the task runs there: in this workspace's context.`
                : ` Leave workspace_id out to run it in the crew member's own chat: only its own memory, files and directly assigned computers apply there, and the user finds the result by talking to it on its own. Add workspace_id to run it in one of the user's workspaces instead: the workspace's shared context, the member's instructions and memory there, its files and its computers (the workspace's own and the member's) all apply, and the result lands in its conversation in that workspace, beside the project it belongs to. Pick a workspace when the work belongs to that project; the member is added to it when it isn't in it yet. Workspaces: ${places || "none"}.`
        }`,
        schema: z.object({
            bot_id: z.number().int(),
            task_id: z.number().int().optional().describe("An open task (list_tasks) to hand over as it is"),
            title: z.string().min(1).max(80).optional(),
            instructions: z.string().min(1).max(8000).optional(),
            workspace_id: z
                .number()
                .int()
                .optional()
                .describe(
                    workspace_id
                        ? "Not available here: a task handed over in a workspace runs in that workspace."
                        : "Run the task in this workspace: its shared context, memory, files and computers apply. Leave it out to run it in the crew member's own chat.",
                ),
        }),
        run: async ({ args }) => {
            /**
             * In a workspace the task can't leave it: the run is already
             * there, and that is the whole point of the hand-over.
             */
            if (workspace_id && args.workspace_id && args.workspace_id != Number(workspace_id)) {
                throw new Error(
                    `A task handed over from a workspace runs in that workspace. Leave workspace_id out, or hand it over from your own chat.`,
                );
            }

            /**
             * A task on a list is read first: one on a workspace's list is
             * worked in that workspace, so the crew comes from there.
             */
            const task = args.task_id
                ? await grabRunTask({ task_id: args.task_id, bot_id: requester_id, is_coordinator, admin_workspace_ids })
                : null;

            const asked_workspace_id = workspace_id || args.workspace_id;

            if (task?.workspace_id && asked_workspace_id && Number(task.workspace_id) != Number(asked_workspace_id)) {
                throw new Error(
                    `Task #${task.id} is on workspace ${task.workspace_id}'s list, so it's worked there. Leave workspace_id out${
                        workspace_id ? ", and hand it over from that workspace or your own chat" : ""
                    }.`,
                );
            }

            const target_workspace_id = workspace_id
                ? Number(workspace_id)
                : task?.workspace_id
                  ? Number(task.workspace_id)
                  : args.workspace_id
                    ? Number(args.workspace_id)
                    : null;

            const fresh = await grabTargets({ workspace_id: target_workspace_id });
            const worker = fresh.find((bot) => bot.id == args.bot_id);

            if (!worker?.id) {
                throw new Error(
                    `No crew member has id ${args.bot_id}${
                        target_workspace_id ? ` in workspace ${target_workspace_id}` : ""
                    }. Crew: ${
                        fresh.map((bot) => `${bot.id}: ${bot.name}`).join("; ") || "none"
                    }.`,
                );
            }

            if (task) {
                const handed = await handOverTask({
                    user_id,
                    task_id: Number(task.id),
                    to_bot_id: Number(worker.id),
                    workspace_id: target_workspace_id,
                    instructions: args.instructions,
                    handed_by: requester_name,
                    requested_by_bot_id: requester_id,
                    requested_by_session_id: session_id,
                });

                return `Task #${task.id} "${task.title}" is with ${worker.name} now (job #${handed.job_id})${
                    handed.workspace_id ? ` in workspace ${handed.workspace_id}` : " in their own chat"
                }, marked doing.${handed.joined} They work that same task; the result is reported back here.`;
            }

            if (!args.title?.trim() || !args.instructions?.trim()) {
                throw new Error(`Give a title and instructions, or the task_id of a task to hand over.`);
            }

            const title = args.title;
            const instructions = args.instructions;

            const joined = target_workspace_id
                ? await ensureBotInWorkspace({ user_id, bot: worker, workspace_id: target_workspace_id })
                : "";

            const computers = await grabBotComputers({
                bot_id: worker.id,
                workspace_id: target_workspace_id,
            });
            const worker_session = await ensureBotSession({
                user_id,
                bot_id: worker.id,
                workspace_id: target_workspace_id,
            });
            const open = await grabOpenBotTask({
                bot_id: worker.id,
                session_id: Number(worker_session.id),
                title,
            });

            if (open) {
                throw new Error(
                    `${worker.name} already has run #${open.id} "${title}" ${open.status == "pending" ? "queued" : "under way"}. Don't hand it over again; it's reported back here when they finish.`,
                );
            }

            const job_id = await enqueueBotJob({
                user_id,
                bot_id: worker.id,
                session_id: Number(worker_session.id),
                title,
                instructions,
                computer_id: computers[0]?.id || undefined,
                requested_by_bot_id: requester_id,
                requested_by_session_id: session_id,
            });

            await pushBotNotice({
                bot_id: worker.id,
                message: await insertBotMessage({
                    bot_id: worker.id,
                    session_id: Number(worker_session.id),
                    workspace_id: target_workspace_id,
                    text: `${requester_name} asked me to: **${title}**`,
                }),
            });

            return `Run #${job_id} is with ${worker.name}${
                target_workspace_id ? ` in workspace ${target_workspace_id}` : " in their own chat"
            } (a run, not a task on the to-do list: list_tasks doesn't show it).${joined} Their result will be in that conversation and reported back here.`;
        },
    };
}
