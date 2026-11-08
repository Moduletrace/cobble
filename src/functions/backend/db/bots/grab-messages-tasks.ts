import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import type { MessageTask } from "@/src/types";
import messageTaskIds from "@/src/utils/message-task-ids";
import taskScopesSql from "@/src/utils/task-access/task-scopes-sql";
import grabCrewRole from "../access/grab-crew-role";

type Params = {
    messages: Pick<BUN_SQLITE_COBBLE_BOT_MESSAGES, "id" | "task_ids">[];
    /**
     * Whose conversation it is: only the tasks they reach are named.
     */
    user_id: number | string;
};

/**
 * The tracker tasks each message is about (`task_ids`), by message id,
 * each with its title and status for its chip. A task the user doesn't
 * reach, or that was deleted, is left out, so a chip never names a task
 * the user couldn't open. Messages naming none are not in the map.
 */
export default async function grabMessagesTasks({ messages, user_id }: Params) {
    const by_message = new Map<number, MessageTask[]>();
    const wanted = new Map<number, number[]>();

    for (const message of messages) {
        const ids = messageTaskIds({ task_ids: message.task_ids });

        if (message.id && ids.length) wanted.set(Number(message.id), ids);
    }

    const all_ids = [...new Set([...wanted.values()].flat())];

    if (!all_ids.length) return by_message;

    const access = taskScopesSql({ role: await grabCrewRole({ user_id }), user_id });

    const res = await BunSQLite.sql<MessageTask>({
        sql: `SELECT t.id, t.title, t.status FROM tasks t
            WHERE t.id IN (${all_ids.map(() => "?").join(", ")}) AND ${access.sql}`,
        values: [...all_ids, ...access.values],
    });

    const tasks = new Map((res.payload || []).map((task) => [Number(task.id), task]));

    for (const [message_id, ids] of wanted) {
        const found = ids.map((id) => tasks.get(id)).filter((task): task is MessageTask => Boolean(task));

        if (found.length) by_message.set(message_id, found);
    }

    return by_message;
}
