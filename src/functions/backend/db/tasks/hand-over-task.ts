import type { BUN_SQLITE_COBBLE_TASKS } from "@/db/types/db";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import AppError from "@/src/utils/app-error";
import handOverPlace from "@/src/utils/hand-over-place";
import grabUserConversation from "../bot-sessions/grab-user-conversation";
import ensureBotSession from "../bot-sessions/ensure-bot-session";
import enqueueBotJob from "../bots-queue/enqueue-bot-job";
import grabOpenBotTask from "../bots-queue/grab-open-bot-task";
import grabBotById from "../bots/grab-bot-by-id";
import insertBotMessage from "../bots/insert-bot-message";
import grabBotComputers from "../computers/grab-bot-computers";
import ensureBotInWorkspace from "../workspaces/ensure-bot-in-workspace";
import addTaskNote from "./add-task-note";
import grabTaskRow, { isOpenTask } from "./grab-task-scope";
import moveTask from "./move-task";
import updateTask from "./update-task";

type Params = {
    /**
     * The user the work runs for. The caller checked they (or the bot's
     * run) reach the task.
     */
    user_id: number | string;
    task_id: number | string;
    /**
     * The bot taking it over.
     */
    to_bot_id: number | string;
    /**
     * Where the work runs, for a task on a bot's own list: left out, the
     * new bot's own chat. A task on a workspace's list always runs there.
     */
    workspace_id?: number | string | null;
    /**
     * More for the brief; the task's own brief comes first.
     */
    instructions?: string;
    /**
     * Who hands it over, shown in the new bot's conversation and the
     * task's log.
     */
    handed_by: string;
    /**
     * The bot handing it over and the session it did from: the result is
     * reported back there (`relayJobToRequester`). None when a user does.
     */
    requested_by_bot_id?: number | string | null;
    requested_by_session_id?: number | string | null;
};

export type HandedOverTask = {
    task: BUN_SQLITE_COBBLE_TASKS;
    job_id: number | string;
    bot_name: string;
    workspace_id: number | null;
    /**
     * Says the bot was added to the workspace first, or "".
     */
    joined: string;
};

/**
 * Hands an open task to another bot and starts the work: a task on a
 * workspace's list stays there (the work runs in that workspace), one on
 * a bot's own list moves to the new bot's. The task goes to doing, its log
 * says who handed it over, and a job is queued in the new bot's
 * conversation with the task's brief and `params.tracker_task_id`, so the
 * bot moves this same task along and the job's end is noted on it.
 */
export default async function handOverTask({
    user_id,
    task_id,
    to_bot_id,
    workspace_id,
    instructions,
    handed_by,
    requested_by_bot_id,
    requested_by_session_id,
}: Params): Promise<HandedOverTask> {
    const task = await grabTaskRow({ task_id });

    if (!isOpenTask({ status: task.status })) {
        throw new AppError(`Task #${task.id} is ${task.status}. Only an open task can be handed over.`);
    }

    if (requested_by_bot_id && Number(to_bot_id) == Number(requested_by_bot_id)) {
        throw new AppError(`Hand the task to another bot, not yourself.`);
    }

    const run_workspace_id = handOverPlace({
        workspace_id: task.workspace_id,
        asked_workspace_id: workspace_id,
        label: `Task #${task.id}`,
    });

    const bot = await grabBotById({ bot_id: to_bot_id });

    if (!bot?.id) {
        throw new AppError(`Bot not found.`);
    }

    const joined = run_workspace_id ? await ensureBotInWorkspace({ user_id, bot, workspace_id: run_workspace_id }) : "";

    /**
     * The user must reach the bot there: its own chat, or the workspace.
     */
    const conversation = await grabUserConversation({ user_id, bot_id: bot.id, workspace_id: run_workspace_id });
    const session = await ensureBotSession({ user_id, bot_id: bot.id, workspace_id: run_workspace_id });
    const title = (task.title || "Task").slice(0, 80);
    const open = await grabOpenBotTask({ bot_id: bot.id, session_id: Number(session.id), title });

    if (open) {
        throw new AppError(
            `${bot.name} already has "${title}" ${open.status == "pending" ? "queued" : "under way"} (job #${open.id}).`,
        );
    }

    const moved = task.workspace_id ? task : await moveTask({ task_id: task.id!, bot_id: bot.id });
    const computers = await grabBotComputers({ bot_id: bot.id, workspace_id: run_workspace_id });

    const brief = [
        task.description?.trim(),
        instructions?.trim(),
        `This is task #${task.id} on ${task.workspace_id ? "this workspace's" : "your"} list, handed over by ${handed_by}. Move it along with update_task as you work, file what it produces on it, and mark it done once you've verified the work.`,
    ]
        .filter(Boolean)
        .join("\n\n");

    const job_id = await enqueueBotJob({
        user_id,
        bot_id: bot.id,
        session_id: Number(session.id),
        title,
        instructions: brief,
        params: { tracker_task_id: Number(task.id) },
        computer_id: computers[0]?.id || undefined,
        requested_by_bot_id: requested_by_bot_id || undefined,
        requested_by_session_id: requested_by_session_id || undefined,
    });

    await updateTask({
        user_id,
        task_id: task.id!,
        status: "doing",
        updated_by_bot_id: requested_by_bot_id || null,
    });

    await addTaskNote({
        task_id: task.id!,
        text: `${handed_by} handed this over to ${bot.name}.`,
        author: requested_by_bot_id ? "bot" : "user",
        bot_id: requested_by_bot_id || null,
    });

    await pushBotNotice({
        bot_id: bot.id,
        message: await insertBotMessage({
            bot_id: bot.id,
            session_id: Number(session.id),
            workspace_id: run_workspace_id,
            text: `${handed_by} handed me task #${task.id}: **${title}**`,
        }),
    });

    return {
        task: { ...moved, status: "doing" },
        job_id,
        bot_name: conversation.bot.name || bot.name || "The bot",
        workspace_id: run_workspace_id,
        joined,
    };
}
