import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotFace } from "@/src/dict/bot-dict";
import { BotReplyJobTitle } from "@/src/dict/bot-queue-dict";
import taskStatusLine from "@/src/utils/task-status-line";

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
 * needs the row), else working on a task (in its workspace, if it runs in
 * one). Null when none is running.
 */
export default async function grabRunningBotJobFace({
    bot_id,
    user_id,
}: Params): Promise<{ face: BotFace; status_line: string } | null> {
    const jobs = (
        await BunSQLite.sql<{ kind: string; workspace_name: string | null }>({
            sql: `SELECT q.kind, w.name AS workspace_name FROM bots_queue q
                LEFT JOIN workspaces w ON w.id = q.workspace_id
                WHERE q.bot_id = ? AND q.status = 'processing'
                AND q.session_id IN (SELECT id FROM bot_sessions WHERE user_id = ?)
                ORDER BY q.id`,
            values: [bot_id, user_id],
        })
    ).payload || [];

    if (jobs.some((job) => job.kind == "reply")) return { face: "working", status_line: BotReplyJobTitle };

    const task = jobs.find((job) => job.kind == "task");

    if (task) return { face: "working", status_line: taskStatusLine({ workspace_name: task.workspace_name }) };

    return null;
}
