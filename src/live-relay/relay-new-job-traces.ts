import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotTraceData } from "@/src/types";
import { sendToUser } from "@/src/websocket/(functions)/send-to-user";

type Params = {
    after_id: number;
    users: Set<string>;
};

type Row = BotTraceData & { user_id: number; id: number };

/**
 * Pushes `server:bot-trace` for every session whose job kept a trace entry
 * newer than `after_id`, to the sockets on this process of the user the
 * job runs for. Only the job and its session travel: a debug view that's
 * open reads the entries it doesn't have. Returns the newest id read.
 */
export default async function relayNewJobTraces({ after_id, users }: Params) {
    const rows =
        (
            await BunSQLite.sql<Row>({
                sql: `SELECT MAX(t.id) AS id, t.bots_queue_id AS job_id, t.session_id, s.user_id
                    FROM bot_job_traces t
                    JOIN bot_sessions s ON s.id = t.session_id
                    WHERE t.id > ?
                    GROUP BY t.session_id
                    ORDER BY id ASC
                    LIMIT 500`,
                values: [after_id],
            })
        ).payload || [];

    for (const { user_id, ...trace } of rows) {
        if (!users.has(String(user_id))) continue;

        sendToUser({
            user_id,
            data: {
                event: "server:bot-trace",
                data: {
                    job_id: Number(trace.job_id),
                    session_id: trace.session_id ? Number(trace.session_id) : null,
                } satisfies BotTraceData,
            },
        });
    }

    return Number(rows[rows.length - 1]?.id) || after_id;
}