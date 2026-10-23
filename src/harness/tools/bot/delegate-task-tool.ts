import { z } from "zod";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import pushBotCreated from "@/src/bots-queue/push-bot-created";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import enqueueBotJob from "@/src/functions/backend/db/bots-queue/enqueue-bot-job";
import grabOpenBotTask from "@/src/functions/backend/db/bots-queue/grab-open-bot-task";
import addBotToWorkspace from "@/src/functions/backend/db/workspaces/add-bot-to-workspace";
import grabUserWorkspaces from "@/src/functions/backend/db/workspaces/grab-user-workspaces";
import grabWorkspaceBots from "@/src/functions/backend/db/workspaces/grab-workspace-bots";
import insertBotMessage from "@/src/functions/backend/db/bots/insert-bot-message";
import grabCrewWorkers from "@/src/functions/backend/db/bots/grab-crew-workers";
import grabBotComputers from "@/src/functions/backend/db/computers/grab-bot-computers";
import ensureBotSession from "@/src/functions/backend/db/bot-sessions/ensure-bot-session";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The coordinator: the worker's result comes back to its conversation.
     */
    coordinator_id: number | string;
    /**
     * The coordinator's session the task is handed over from.
     */
    session_id: number | string;
    /**
     * The workspace the coordinator is working in: the worker works on it
     * there, in its conversation in the workspace.
     */
    workspace_id?: number | string | null;
    /**
     * The coordinator's name, shown in the worker's conversation.
     */
    coordinator_name: string;
    /**
     * The worker bots it can hand work to (in a workspace, its members).
     */
    workers: BUN_SQLITE_COBBLE_BOTS[];
    /**
     * The user's live workspaces, for the picker. In a workspace there's
     * nothing to pick: the task runs there.
     */
    workspaces?: BUN_SQLITE_COBBLE_WORKSPACES[];
};

type Args = {
    bot_id: number;
    title: string;
    instructions: string;
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
 * The worker runs it on the computer it's on there (if it has one) and
 * posts the result in that conversation, where a note says who asked; the
 * result (or failure) is also reported back in the coordinator's
 * conversation.
 */
export default function delegateTaskTool({
    user_id,
    coordinator_id,
    session_id,
    workspace_id,
    coordinator_name,
    workers,
    workspaces = [],
}: Params): HarnessTool<Args> {
    const crew = workers
        .map((bot) => `${bot.id}: ${bot.name}${bot.role ? ` (${bot.role})` : ""}`)
        .join("; ");
    const places = workspaces
        .map((w) => `${w.id}: ${w.name}`)
        .join("; ");

    return {
        name: "delegate_task",
        description: `Hand a task to a crew member. They run it in the background and post the result in their own conversation; it's also reported back here when they finish or fail. Write the instructions as a full brief: what to do, where, and how they'll know it's done. Crew: ${crew}.${
            workspace_id
                ? ` You are working in a workspace, so the task runs there: in this workspace's context.`
                : ` Leave workspace_id out to run it in the crew member's own chat: only its own memory, files and directly assigned computers apply there, and the user finds the result by talking to it on its own. Add workspace_id to run it in one of the user's workspaces instead: the workspace's shared context, the member's instructions and memory there, its files and its computers (the workspace's own and the member's) all apply, and the result lands in its conversation in that workspace, beside the project it belongs to. Pick a workspace when the work belongs to that project; the member is added to it when it isn't in it yet. Workspaces: ${places || "none"}.`
        }`,
        schema: z.object({
            bot_id: z.number().int(),
            title: z.string().min(1).max(80),
            instructions: z.string().min(1).max(8000),
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

            const target_workspace_id = workspace_id
                ? Number(workspace_id)
                : args.workspace_id
                  ? Number(args.workspace_id)
                  : null;

            const fresh = await grabCrewWorkers({ workspace_id: target_workspace_id });
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

            const joined = target_workspace_id
                ? await ensureWorkerInWorkspace({ user_id, worker, target_workspace_id })
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
                title: args.title,
            });

            if (open) {
                throw new Error(
                    `${worker.name} already has task #${open.id} "${args.title}" ${open.status == "pending" ? "queued" : "under way"}. Don't hand it over again; it's reported back here when they finish.`,
                );
            }

            const job_id = await enqueueBotJob({
                user_id,
                bot_id: worker.id,
                session_id: Number(worker_session.id),
                title: args.title,
                instructions: args.instructions,
                computer_id: computers[0]?.id || undefined,
                requested_by_bot_id: coordinator_id,
                requested_by_session_id: session_id,
            });

            await pushBotNotice({
                bot_id: worker.id,
                message: await insertBotMessage({
                    bot_id: worker.id,
                    session_id: Number(worker_session.id),
                    workspace_id: target_workspace_id,
                    text: `${coordinator_name} asked me to: **${args.title}**`,
                }),
            });

            return `Task #${job_id} is with ${worker.name}${
                target_workspace_id ? ` in workspace ${target_workspace_id}` : " in their own chat"
            }.${joined} Their result will be in that conversation and reported back here.`;
        },
    };
}

type EnsureParams = {
    user_id: number | string;
    worker: BUN_SQLITE_COBBLE_BOTS;
    target_workspace_id: number;
};

/**
 * A worker can only run a task in a workspace it's in, and a workspace's
 * members were already listed by `grabCrewWorkers`. Anyone else is added
 * first, since delegation is exactly the moment the broker decides who
 * does the work where.
 */
async function ensureWorkerInWorkspace({
    user_id,
    worker,
    target_workspace_id,
}: EnsureParams) {
    if (!worker.id) return "";

    const workspaces = (await grabUserWorkspaces({ user_id })).filter((w) => !w.archived);
    const workspace = workspaces.find((w) => w.id == target_workspace_id);

    if (!workspace) {
        throw new Error(
            `No workspace has id ${target_workspace_id}. Workspaces: ${
                workspaces.map((w) => `${w.id}: ${w.name}`).join("; ") || "none"
            }. Hand the task over without workspace_id to run it in the crew member's own chat.`,
        );
    }

    const members = await grabWorkspaceBots({ user_id, workspace_id: target_workspace_id });

    if (members.some((bot) => bot.id == worker.id)) return "";

    await addBotToWorkspace({
        user_id,
        workspace_id: target_workspace_id,
        bot_id: Number(worker.id),
    });
    await pushBotCreated({ bot: worker });

    return ` ${worker.name} wasn't in "${workspace.name}", so it was added to it first.`;
}
