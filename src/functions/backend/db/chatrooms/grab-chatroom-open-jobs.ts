import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    chatroom_id: number | string;
    /**
     * The job asking (the coordinator's own turn), which is still running as
     * it reads: never counted.
     */
    except_job_id?: number | string | null;
};

export type ChatroomOpenJob = {
    id: number;
    bot_id: number | null;
    bot_name: string | null;
    status: string;
};

/**
 * The jobs a room still runs (pending or processing), with the bot each
 * works for: closing a room cancels them (`cancelChatroomJobs`), so the
 * tools that close one ask first whether anyone is still at work.
 */
export default async function grabChatroomOpenJobs({ chatroom_id, except_job_id }: Params): Promise<ChatroomOpenJob[]> {
    const res = await BunSQLite.sql<ChatroomOpenJob>({
        sql: `SELECT q.id, q.bot_id, b.name AS bot_name, q.status
            FROM bots_queue q
            JOIN bot_sessions s ON s.id = q.session_id
            LEFT JOIN bots b ON b.id = q.bot_id
            WHERE s.chatroom_id = ? AND q.status IN ('pending', 'processing') AND q.id != ?
            ORDER BY q.id`,
        values: [Number(chatroom_id), Number(except_job_id) || 0],
    });

    return (res.payload || []).map((job) => ({
        id: Number(job.id),
        bot_id: job.bot_id ? Number(job.bot_id) : null,
        bot_name: job.bot_name || null,
        status: job.status,
    }));
}