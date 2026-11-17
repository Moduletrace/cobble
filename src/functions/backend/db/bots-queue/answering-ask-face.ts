import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotFace } from "@/src/dict/bot-dict";
import { BotReplyJobTitle } from "@/src/dict/bot-queue-dict";

type Params = {
    bot_id: number | string;
    user_id: number | string;
};

/**
 * The face a bot shows one user while it answers another bot's crew request
 * for them. That run works in a hidden session, which
 * `grabRunningBotJobFace` leaves out on purpose, so without this a job that
 * finished beside it would put the bot to sleep while the request was still
 * being answered. Null when no request is running.
 */
export default async function answeringAskFace({
    bot_id,
    user_id,
}: Params): Promise<{ face: BotFace; status_line: string } | null> {
    const running = (
        await BunSQLite.sql<{ id: number }>({
            sql: `SELECT q.id FROM bots_queue q
                WHERE q.bot_id = ? AND q.status = 'processing'
                AND q.session_id IN (SELECT id FROM bot_sessions WHERE user_id = ? AND ask_id IS NOT NULL)
                LIMIT 1`,
            values: [bot_id, user_id],
        })
    ).payload?.[0];

    return running ? { face: "working", status_line: BotReplyJobTitle } : null;
}