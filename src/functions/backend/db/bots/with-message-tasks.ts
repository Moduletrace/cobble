import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import type { MessageTask } from "@/src/types";
import grabMessagesTasks from "./grab-messages-tasks";

type Params<T extends BUN_SQLITE_COBBLE_BOT_MESSAGES> = {
    messages: T[];
    /**
     * Whose conversation they're in.
     */
    user_id: number | string;
};

/**
 * The messages with the tracker tasks they're about (`tasks`), for a live
 * push: a pushed bot message must carry its task chips like a loaded one
 * (`grabBotMessages`), or they show only after a reload. Messages naming
 * no task are left as they are.
 */
export default async function withMessageTasks<T extends BUN_SQLITE_COBBLE_BOT_MESSAGES>({
    messages,
    user_id,
}: Params<T>): Promise<(T & { tasks?: MessageTask[] })[]> {
    if (!messages.some((message) => message.task_ids)) return messages;

    const tasks = await grabMessagesTasks({ messages, user_id });

    return messages.map((message) => {
        const found = tasks.get(Number(message.id));

        return found ? { ...message, tasks: found } : message;
    });
}
