import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotFace } from "@/src/dict/bot-dict";
import { BotReplyJobTitle, BotTaskStatusLine } from "@/src/dict/bot-queue-dict";

type Params = {
    bot_id: number | string;
    /**
     * Only jobs in this user's conversations.
     */
    user_id: number | string;
};

/**
 * The face a bot should show one user while other jobs for them are
 * still running: thinking while a reply runs (it's short, and its chat
 * needs the row), else working on a task. Null when none is running.
 */
export default async function grabRunningBotJobFace({
    bot_id,
    user_id,
}: Params): Promise<{ face: BotFace; status_line: string } | null> {
    const kinds = (
        await BunSQLite.sql<{ kind: string }>({
            sql: `SELECT DISTINCT kind FROM bots_queue WHERE bot_id = ? AND status = 'processing'
                AND session_id IN (SELECT id FROM bot_sessions WHERE user_id = ?)`,
            values: [bot_id, user_id],
        })
    ).payload?.map((row) => row.kind) || [];

    if (kinds.includes("reply")) return { face: "working", status_line: BotReplyJobTitle };
    if (kinds.includes("task")) return { face: "working", status_line: BotTaskStatusLine };

    return null;
}
