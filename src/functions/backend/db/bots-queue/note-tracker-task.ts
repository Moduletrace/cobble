import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import parseJobJson from "@/src/bots-queue/parse-job-json";
import { AppData } from "@/src/data/app-data";
import { logError } from "@/src/functions/backend/logger";
import grabBotById from "../bots/grab-bot-by-id";
import addTaskNote from "../tasks/add-task-note";
import grabTaskRow, { isOpenTask } from "../tasks/grab-task-scope";
import updateTask from "../tasks/update-task";
import grabJobUserId from "./grab-job-user-id";

type Params = {
    job: BUN_SQLITE_COBBLE_BOTS_QUEUE;
    /**
     * Why it failed; left out when it finished.
     */
    failure?: string;
};

/**
 * The end of a job worked on a handed-over task (`params.tracker_task_id`,
 * set by `handOverTask`), written on that task while it's still open: a
 * run that finished without closing it says so, a failed one blocks it
 * with the reason. The bot moves the task along itself as it works; this
 * only keeps the task honest when it didn't. Best effort: never fails
 * the job's wrap-up.
 */
export default async function noteTrackerTask({ job, failure }: Params) {
    const tracker_task_id = Number(parseJobJson({ text: job.params })?.tracker_task_id || 0);

    if (!tracker_task_id || !job.bot_id) return;

    try {
        const task = await grabTaskRow({ task_id: tracker_task_id });

        if (!isOpenTask({ status: task.status })) return;

        const name = (await grabBotById({ bot_id: job.bot_id }))?.name || "The bot";

        if (failure === undefined) {
            await addTaskNote({
                task_id: tracker_task_id,
                text: `${name}'s run finished; the task is still ${task.status}.`,
                bot_id: job.bot_id,
            });
            return;
        }

        const reason = `${name} couldn't finish it. ${failure}`.trim().slice(0, AppData.TaskNoteMaxLength);
        const user_id = await grabJobUserId({ job });

        if (user_id) {
            await updateTask({
                user_id,
                task_id: tracker_task_id,
                status: "blocked",
                blocked_reason: reason,
                updated_by_bot_id: job.bot_id,
            });
        }

        await addTaskNote({ task_id: tracker_task_id, text: reason, bot_id: job.bot_id });
    } catch (error) {
        await logError({
            title: `Couldn't note job #${job.id} on task #${tracker_task_id}`,
            error,
        }).catch(() => {});
    }
}
