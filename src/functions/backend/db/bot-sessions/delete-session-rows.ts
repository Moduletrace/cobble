import BunSQLite from "@moduletrace/bun-sqlite";
import deleteUnlinkedAttachmentMedia from "../media/delete-unlinked-attachment-media";
import deleteBotPlanRows from "../bot-plans/delete-bot-plan-rows";

type Params = {
    session_ids: number[];
};

/**
 * Deletes sessions with everything their runs left behind, children first
 * (foreign keys are off outside the server process): queue updates, job
 * traces, jobs, what the runs were billed (`token_usages`), job tasks,
 * reactions, message files, messages, tasks, then the sessions.
 * Files a message carried are unlinked, and their media row is deleted once
 * nothing else points at it. A newer session's `previous_session_id` and a
 * message's `carried_from_session_id` that named one of these are cleared,
 * since neither is a foreign key.
 */
export default async function deleteSessionRows({ session_ids }: Params) {
    const ids = session_ids.map(Number).filter(Boolean);

    if (!ids.length) return;

    const session_placeholders = ids.map(() => "?").join(", ");

    const job_ids = (
        await BunSQLite.sql<{ id: number }>({
            sql: `SELECT id FROM bots_queue WHERE session_id IN (${session_placeholders})`,
            values: ids,
        })
    ).payload || [];
    const jobs = job_ids.map((job) => Number(job.id));

    if (jobs.length) {
        const job_placeholders = jobs.map(() => "?").join(", ");

        await BunSQLite.sql({
            sql: `DELETE FROM bots_queue_updates WHERE bots_queue_id IN (${job_placeholders})`,
            values: jobs,
        });
        await BunSQLite.sql({
            sql: `DELETE FROM bot_job_traces WHERE bots_queue_id IN (${job_placeholders})`,
            values: jobs,
        });
        await BunSQLite.sql({
            sql: `DELETE FROM token_usages WHERE job_id IN (${job_placeholders})`,
            values: jobs,
        });
        await BunSQLite.sql({
            sql: `DELETE FROM bots_queue WHERE id IN (${job_placeholders})`,
            values: jobs,
        });
    }

    const message_ids = (
        await BunSQLite.sql<{ id: number }>({
            sql: `SELECT id FROM bot_messages WHERE session_id IN (${session_placeholders})`,
            values: ids,
        })
    ).payload || [];
    const messages = message_ids.map((message) => Number(message.id));

    if (messages.length) {
        const message_placeholders = messages.map(() => "?").join(", ");

        const media_ids = (
            await BunSQLite.sql<{ media_id: number }>({
                sql: `SELECT media_id FROM bot_message_media WHERE message_id IN (${message_placeholders})`,
                values: messages,
            })
        ).payload || [];

        await BunSQLite.sql({
            sql: `DELETE FROM bot_message_reactions WHERE message_id IN (${message_placeholders})`,
            values: messages,
        });
        await BunSQLite.sql({
            sql: `DELETE FROM bot_message_media WHERE message_id IN (${message_placeholders})`,
            values: messages,
        });
        await BunSQLite.sql({
            sql: `DELETE FROM bot_questions WHERE message_id IN (${message_placeholders})`,
            values: messages,
        });
        await BunSQLite.sql({
            sql: `DELETE FROM bot_suggestions WHERE message_id IN (${message_placeholders})`,
            values: messages,
        });
        await BunSQLite.sql({
            sql: `DELETE FROM token_usages WHERE message_id IN (${message_placeholders})`,
            values: messages,
        });
        await BunSQLite.sql({
            sql: `DELETE FROM bot_messages WHERE id IN (${message_placeholders})`,
            values: messages,
        });

        await deleteUnlinkedAttachmentMedia({
            media_ids: media_ids.map((media) => Number(media.media_id)),
        });
    }

    await BunSQLite.sql({
        sql: `DELETE FROM token_usages WHERE session_id IN (${session_placeholders})`,
        values: ids,
    });
    await BunSQLite.sql({
        sql: `DELETE FROM bot_tasks WHERE session_id IN (${session_placeholders})`,
        values: ids,
    });
    await deleteBotPlanRows({ session_ids: ids });

    /**
     * A newer session may carry on from one of these, and a message may have
     * carried one over: neither link is a foreign key, so it dangles.
     */
    await BunSQLite.sql({
        sql: `UPDATE bot_sessions SET previous_session_id = NULL WHERE previous_session_id IN (${session_placeholders})`,
        values: ids,
    });
    await BunSQLite.sql({
        sql: `UPDATE bot_messages SET carried_from_session_id = NULL WHERE carried_from_session_id IN (${session_placeholders})`,
        values: ids,
    });

    await BunSQLite.sql({
        sql: `DELETE FROM bot_sessions WHERE id IN (${session_placeholders})`,
        values: ids,
    });
}
