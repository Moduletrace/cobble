import { useState } from "react";
import useServerEvent from "@/src/hooks/use-server-event";
import type { BotJobUpdateData, BotTaskWithSteps, BotUpdatedData } from "@/src/types";

type Params = {
    bot_id: number;
    /**
     * The open session: steps of jobs from other sessions are left out.
     */
    session_id?: number | null;
    /**
     * The bot's active task when the page loaded.
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
 * The latest step of the open bot's active task (a `bots_queue_updates`
 * row's text), kept current from `server:bot-job-update`. Starts over when
 * `server:bot-updated` brings a different task, or none.
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

            setProgress((prev) =>
                (data.task?.id || null) == prev.task_id ? prev : fromTask({ task: data.task }),
            );
        },
    });

    return progress.text;
}
