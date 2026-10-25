import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    job_id: number | string;
    /**
     * The newest user message the reply read.
     */
    message_id: number;
};

/**
 * Records the newest user message a running reply read, so a reply queued
 * for a message it already took in finishes silently and one it missed is
 * still answered (`grabAnsweredMessageId`). Never lowers it.
 */
export default async function markReplyAnswered({ job_id, message_id }: Params) {
    await BunSQLite.sql({
        sql: `UPDATE bots_queue SET message_id = ?
            WHERE id = ? AND status = 'processing' AND (message_id IS NULL OR message_id < ?)`,
        values: [message_id, job_id, message_id],
    });
}
