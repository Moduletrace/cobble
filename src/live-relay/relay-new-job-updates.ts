import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotJobUpdateData } from "@/src/types";
import { sendToUser } from "@/src/websocket/(functions)/send-to-user";

type Params = {
    after_id: number;
    users: Set<string>;
};

/**
 * Pushes `server:bot-job-update` for every job step newer than `after_id`
 * to its owner's sockets on this process. Returns the newest id read.
 */
export default async function relayNewJobUpdates({ after_id, users }: Params) {
    const rows =
        (
            await BunSQLite.sql<BotJobUpdateData & { user_id: number }>({
                sql: `SELECT u.*, q.task_id, q.session_id, b.user_id FROM bots_queue_updates u
                    JOIN bots_queue q ON q.id = u.bots_queue_id
                    JOIN bots b ON b.id = u.bot_id
                    WHERE u.id > ? ORDER BY u.id ASC LIMIT 500`,
                values: [after_id],
            })
        ).payload || [];

    for (const { user_id, ...update } of rows) {
        if (users.has(String(user_id))) {
            sendToUser({ user_id, data: { event: "server:bot-job-update", data: update } });
        }
    }

    return Number(rows[rows.length - 1]?.id) || after_id;
}
