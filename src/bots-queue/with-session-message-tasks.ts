import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES, BUN_SQLITE_COBBLE_BOT_SESSIONS } from "@/db/types/db";
import withMessageTasks from "@/src/functions/backend/db/bots/with-message-tasks";

type Params = {
    message: BUN_SQLITE_COBBLE_BOT_MESSAGES;
};

/**
 * A message about to be pushed, with the tracker tasks it's about as its
 * session's user sees them (`withMessageTasks`). Without any, or when the
 * session is gone, it's returned as it is.
 */
export default async function withSessionMessageTasks({ message }: Params) {
    if (!message.task_ids || !message.session_id) return message;

    const session = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS>({
            sql: `SELECT user_id FROM bot_sessions WHERE id = ? LIMIT 1`,
            values: [message.session_id],
        })
    ).payload?.[0];

    if (!session?.user_id) return message;

    return (await withMessageTasks({ messages: [message], user_id: session.user_id }))[0] ?? message;
}
