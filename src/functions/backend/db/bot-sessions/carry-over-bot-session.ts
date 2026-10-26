import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import AppError from "@/src/utils/app-error";
import insertBotMessage from "../bots/insert-bot-message";
import createBotSession from "./create-bot-session";
import grabActiveBotSession from "./grab-active-bot-session";

type Params = {
    /**
     * The session the bot is answering in: it must be the conversation's
     * active one.
     */
    session_id: number | string;
    user_id: number | string;
    bot_id: number;
    workspace_id?: number | null;
    /**
     * What the next session needs to carry on (markdown), written by the
     * bot.
     */
    summary: string;
    /**
     * The new session's title, written by the bot. Left out: the closed
     * session's.
     */
    title?: string | null;
    /**
     * The reply moving it: its answer goes in the new session, under the
     * summary.
     */
    job_id?: number | null;
};

/**
 * Moves a conversation into a fresh session when the bot asks to
 * (`continue_in_new_session`): the bot's summary is kept on the session it
 * closes (covering all its messages, so `grabSessionCarryOver` hands it to
 * the next prompt as written) and opens the new one as a bot message
 * (`carried_from_session_id`), and the reply's own answer follows it
 * there. The new session is titled by the bot (else after the old one).
 * Returns that first message, for the caller to push.
 */
export default async function carryOverBotSession({
    session_id,
    user_id,
    bot_id,
    workspace_id,
    summary,
    title,
    job_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_MESSAGES> {
    const text = summary.trim().slice(0, AppData.BotSessionSummaryMaxChars);

    if (!text) throw new AppError(`The summary is empty.`);

    const active = await grabActiveBotSession({ user_id, bot_id, workspace_id });

    if (!active?.id || active.id != Number(session_id)) {
        throw new AppError(`This session isn't the conversation's current one, so it can't be moved on from.`);
    }

    const message_count =
        Number(
            (
                await BunSQLite.sql<{ n: number }>({
                    sql: `SELECT COUNT(*) AS n FROM bot_messages WHERE session_id = ?`,
                    values: [active.id],
                })
            ).payload?.[0]?.n,
        ) || 0;

    if (!message_count) {
        throw new AppError(`This session has no messages yet: it's already fresh.`);
    }

    const now = Date.now();

    await BunSQLite.sql({
        sql: `UPDATE bot_sessions SET status = 'closed', unread = 0, summary = ?, summary_message_count = ?, updated_at = ?
            WHERE id = ?`,
        values: [text, message_count, now, active.id],
    });

    /**
     * A session is named after its first exchange (`nameBotSession`), and
     * this one opens with the bot's messages alone: it's named now, and
     * previewed with the summary it opens with. The summary covers none
     * of its own messages, so it's written again before it's carried on.
     */
    const next = await createBotSession({
        user_id,
        bot_id,
        workspace_id,
        previous_session_id: active.id,
        title:
            title?.replace(/\s+/g, " ").trim().slice(0, AppData.BotSessionTitleMaxChars) ||
            active.title ||
            null,
    });

    await BunSQLite.sql({
        sql: `UPDATE bot_sessions SET summary = ?, summary_message_count = 0 WHERE id = ?`,
        values: [text, next.id!],
    });

    const message = await insertBotMessage({
        bot_id,
        session_id: Number(next.id),
        workspace_id,
        text,
        carried_from_session_id: active.id,
    });

    if (job_id) {
        await BunSQLite.sql({
            sql: `UPDATE bots_queue SET session_id = ? WHERE id = ?`,
            values: [next.id!, job_id],
        });
    }

    return message;
}
