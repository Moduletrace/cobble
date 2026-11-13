import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import { logError } from "@/src/functions/backend/logger";
import grabBotById from "../bots/grab-bot-by-id";
import addTaskNote from "../tasks/add-task-note";
import grabTaskRow, { isOpenTask } from "../tasks/grab-task-scope";
import updateTask from "../tasks/update-task";
import grabJobUserId from "./grab-job-user-id";
import jobTrackerTaskId from "./job-tracker-task-id";
import trackerTaskEnding from "./tracker-task-ending";

type Params = {
    job: BUN_SQLITE_COBBLE_BOTS_QUEUE;
    /**
     * Why it failed; left out when it finished.
     */
    failure?: string;
    /**
     * The run used every step it was allowed and stopped before finishing
     * (`run-bot-task`'s `result.steps > max_steps`). A finished run that
     * did no work blocks the task, rather than leaving it `doing`.
     */
    exhausted?: boolean;
};

/**
 * The end of a job worked on a handed-over task (`params.tracker_task_id`,
 * set by `handOverTask`), written on that task while it's still open: a
 * run that finished without closing it says so, a failed one blocks it
 * with the reason, and so does one that used up every step it had without
 * doing the work (`trackerTaskEnding`). The bot moves the task along
 * itself as it works; this only keeps the task honest when it didn't. Best
 * effort: never fails the job's wrap-up.
 */
export default async function noteTrackerTask({ job, failure, exhausted }: Params) {
    const tracker_task_id = jobTrackerTaskId({ job });

    if (!tracker_task_id || !job.bot_id) return;

    try {
        const task = await grabTaskRow({ task_id: tracker_task_id });

        if (!isOpenTask({ status: task.status })) return;

        const name = (await grabBotById({ bot_id: job.bot_id }))?.name || "The bot";
        const ending = trackerTaskEnding({ name, status: task.status, failure, exhausted });
        const text = ending.note.slice(0, AppData.TaskNoteMaxLength);

        if (ending.blocked_reason === null) {
            await addTaskNote({ task_id: tracker_task_id, text, bot_id: job.bot_id });
            return;
        }

        const user_id = await grabJobUserId({ job });

        if (user_id) {
            await updateTask({
                user_id,
                task_id: tracker_task_id,
                status: "blocked",
                blocked_reason: text,
                updated_by_bot_id: job.bot_id,
            });
        }

        await addTaskNote({ task_id: tracker_task_id, text, bot_id: job.bot_id });
    } catch (error) {
        await logError({
            title: `Couldn't note job #${job.id} on task #${tracker_task_id}`,
            error,
        }).catch(() => {});
    }
}
