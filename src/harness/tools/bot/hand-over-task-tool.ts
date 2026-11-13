import { z } from "zod";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import type { BotRunPowers } from "@/src/functions/backend/db/bot-types/grab-bot-run-powers";
import grabRunTask from "@/src/functions/backend/db/tasks/grab-run-task";
import handOverTask from "@/src/functions/backend/db/tasks/hand-over-task";
import type { HarnessTool } from "../../types";

type Params = {
    user_id: number | string;
    /**
     * The bot passing its own task on: the worker that has it, or a
     * workspace's admin.
     */
    bot: BUN_SQLITE_COBBLE_BOTS;
    /**
     * The session it hands over from: the new bot's result is reported
     * back there (`relayJobToRequester`).
     */
    session_id: number | string;
    /**
     * The run's reach over the task tracker (`grabBotRunPowers`), beside the
     * check that the task is this bot's own.
     */
    powers: BotRunPowers;
    /**
     * The bots it may hand to, for the description (`chatroomAskableBots`).
     */
    workers: BUN_SQLITE_COBBLE_BOTS[];
    /**
     * Reads the bots it may hand to when it does, so a bot added mid-run is
     * there: the ones it could ask (`chatroomAskableBots`).
     */
    grabTargets: () => Promise<BUN_SQLITE_COBBLE_BOTS[]>;
    /**
     * Called with the task it hands over, so the message the run posts links
     * to it (`bot_messages.task_ids`).
     */
    onTask?: (params: { task_id: number }) => void;
};

type Args = {
    task_id: number;
    bot_id: number;
    /**
     * False to only move it: the task goes to the other bot's list as to do
     * and no job is queued, for when the user hasn't asked for the work to
     * begin.
     */
    start?: boolean;
};

/**
 * Lets a bot give a task on its own list to another bot (`handOverTask`):
 * the narrow hand-over of `delegate_task`, for the runs that have no right
 * to hand out work. It only ever moves a task the run already has, only an
 * open one, and only to a bot it could ask for the same user, so it can't
 * create a task for someone else or widen a run's reach. The task keeps its
 * place (a workspace's stays there), the other bot works that same task, and
 * the result is reported back in this session.
 */
export default function handOverTaskTool({ user_id, bot, session_id, powers, workers, grabTargets, onTask }: Params): HarnessTool<Args> {
    const bot_id = bot.id || 0;
    const crew = workers.map((worker) => `${worker.id}: ${worker.name}`).join("; ");

    return {
        name: "hand_over_task",
        description: `Hand over a task on your own list to another bot, when the user asked for that task to go to them. Pass its task_id (list_tasks) and the bot: the task moves to their list and they work that same task there, and their result is reported back here. Only a task of your own, and only an open one. To ask a bot something without giving it a task, use ask_crew; to have work made for another bot, ask the user. Crew you can hand to: ${crew || "none"}.`,
        schema: z.object({
            task_id: z.number().int().describe("An open task on your own list (list_tasks)"),
            bot_id: z.number().int(),
            start: z
                .boolean()
                .optional()
                .describe("false to only move the task (to do, nothing runs) until the user says to start"),
        }),
        run: async ({ args }) => {
            const task = await grabRunTask({
                task_id: args.task_id,
                bot_id,
                is_coordinator: powers.is_coordinator,
                admin_workspace_ids: powers.admin_workspace_ids,
            });

            /**
             * A workspace-wide task is nobody's: handing it to one bot would
             * take it away from the rest of the crew.
             */
            if (Number(task.bot_id || 0) != bot_id) {
                throw new Error(
                    `Task #${task.id} isn't on your own list (it's ${
                        task.workspace_id && !task.bot_id ? "workspace-wide" : "another bot's"
                    }), so it isn't yours to hand over.`,
                );
            }

            const fresh = await grabTargets();

            if (!fresh.some((target) => target.id == args.bot_id)) {
                throw new Error(
                    `No bot has id ${args.bot_id} among the ones you can hand to. Bot: ${
                        fresh.map((target) => `${target.id}: ${target.name}`).join("; ") || "none"
                    }.`,
                );
            }

            const handed = await handOverTask({
                user_id,
                task_id: Number(task.id),
                to_bot_id: args.bot_id,
                instructions: undefined,
                handed_by: bot.name || "The bot that had it",
                requested_by_bot_id: bot_id,
                requested_by_session_id: session_id,
                start: args.start !== false,
            });

            onTask?.({ task_id: Number(task.id) });

            const where = handed.workspace_id ? ` in workspace ${handed.workspace_id}` : " in its own chat";

            if (!handed.job_id) {
                return `Task #${task.id} "${task.title}" is on ${handed.bot_name}'s list now${where}, as to do. Nothing is running: they start when the user tells them to.`;
            }

            return `Task #${task.id} "${task.title}" is with ${handed.bot_name} now (job #${handed.job_id})${where}, marked doing, and it's off your list.${handed.joined} They work that same task; their result is reported back here.`;
        },
    };
}