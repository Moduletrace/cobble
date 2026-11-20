import { useCallback, useState } from "react";
import useServerEvent from "@/src/hooks/use-server-event";
import type { BotJobUpdateData, BotTaskWithSteps, BotUpdatedData } from "@/src/types";

type Params = {
    bot_id: number;
    /**
     * The open session: steps of jobs from other sessions are left out.
     */
    session_id?: number | null;
    /**
     * The bot's active task when the thread started.
     */
    task: BotTaskWithSteps | null;
};

type Progress = {
    task_id: number | null;
    text: string | null;
};

function fromTask({ task }: { task: BotTaskWithSteps | null }): Progress {
    return {
        task_id: task?.id || null,
        text: task?.updates[task.updates.length - 1]?.text || null,
    };
}

/**
 * The task of the session on screen, out of every task the push carries:
 * the newest of them all is often a run in another conversation, and taking
 * that one left this thread with nothing (`task` alone, when the push has no
 * list).
 */
function ownTask({
    data,
    session_id,
}: {
    data: Pick<BotUpdatedData, "task" | "tasks">;
    session_id?: number | null;
}): BotTaskWithSteps | null {
    const tasks = data.tasks || (data.task ? [data.task] : []);
    const mine = session_id ? tasks.find((task) => task.session_id == session_id) : tasks[0];

    return mine || null;
}

/**
 * The open session's active task and its latest step (a
 * `bots_queue_updates` row's text), kept current from
 * `server:bot-job-update`. Starts over when `server:bot-updated` brings a
 * different task, or none, or `reset` brings a loaded history's.
 */
export default function useTaskProgress({ bot_id, session_id, task }: Params) {
    const [progress, setProgress] = useState<Progress>(() => fromTask({ task }));

    useServerEvent({
        event: "server:bot-job-update",
        onData: (update: BotJobUpdateData) => {
            if (update.bot_id != bot_id || !update.task_id || !update.text) return;
            if (session_id && update.session_id && update.session_id != session_id) return;

            setProgress({ task_id: update.task_id, text: update.text });
        },
    });

    useServerEvent({
        event: "server:bot-updated",
        onData: (data: BotUpdatedData) => {
            if (data.id != bot_id) return;

            /**
             * The user's active task with the bot may be in another of
             * their conversations with it.
             */
            const task = ownTask({ data, session_id });

            setProgress((prev) => ((task?.id || null) == prev.task_id ? prev : fromTask({ task })));
        },
    });

    const reset = useCallback(({ task }: { task: BotTaskWithSteps | null }) => {
        setProgress(fromTask({ task }));
    }, []);

    return { ...progress, reset };
}
