import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotJobKind } from "@/src/dict/bot-queue-dict";

type Params = {
    messages: { id?: number | string; failed_job_id?: number | string }[];
};

type JobRow = { id: number; kind: BotJobKind };

/**
 * The kind of job behind each message that is a failure notice
 * (`failed_job_id`), by the message's id, so the thread can offer Retry
 * on a failed reply without loading the jobs themselves. A notice whose
 * job is gone (pruned) is left out.
 */
export default async function grabMessagesFailedJobs({ messages }: Params) {
    const by_message = new Map<number, BotJobKind>();
    const job_to_message = new Map<number, number>();

    for (const message of messages) {
        const job_id = Number(message.failed_job_id);
        const message_id = Number(message.id);

        if (job_id && message_id) job_to_message.set(job_id, message_id);
    }

    const ids = [...job_to_message.keys()];

    if (!ids.length) return by_message;

    const rows =
        (
            await BunSQLite.sql<JobRow>({
                sql: `SELECT id, kind FROM bots_queue WHERE id IN (${ids.map(() => "?").join(", ")})`,
                values: ids,
            })
        ).payload || [];

    for (const row of rows) {
        const message_id = job_to_message.get(Number(row.id));

        if (message_id) by_message.set(message_id, row.kind);
    }

    return by_message;
}
