import BunSQLite from "@moduletrace/bun-sqlite";
import { AppData } from "@/src/data/app-data";
import type { BotSessionListItem } from "@/src/types";
import followedSessionSql from "./followed-session-sql";
import visibleSessionSql from "./visible-session-sql";

type Params = {
    /**
     * The user the conversation is with.
     */
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    /**
     * Matches the session's title, summary or any of its messages.
     */
    query?: string;
    page?: number;
    /**
     * How many to return; a page by default.
     */
    limit?: number;
    /**
     * Leave out a silent hook's thread, which the rail doesn't list (it's
     * read in the sessions modal and on the hook itself).
     */
    attended_only?: boolean;
};

/**
 * A user's conversation's sessions for the sessions modal, latest activity
 * first, each with its message count, latest message and the routine or
 * hook that runs in it. Empty sessions are left out unless active. A
 * routine's and a hook's threads are ordinary sessions, so the user can
 * open and chat in them; only a crew request's is hidden.
 */
export default async function grabBotSessions({
    user_id,
    bot_id,
    workspace_id,
    query,
    page = 1,
    limit,
    attended_only,
}: Params): Promise<BotSessionListItem[]> {
    const search = query?.trim();
    const like = search ? `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : null;
    const page_size = limit || AppData.BotSessionsPageSize;

    let sql = ``;

    sql += `SELECT s.*,\n`;
    sql += `    (SELECT COUNT(*) FROM bot_messages m WHERE m.session_id = s.id) AS message_count,\n`;
    sql += `    (SELECT m.text FROM bot_messages m WHERE m.session_id = s.id ORDER BY m.created_at DESC, m.id DESC LIMIT 1) AS last_message_text,\n`;
    sql += `    (SELECT c.title FROM cron_jobs c WHERE c.id = s.routine_id) AS routine_title,\n`;
    sql += `    (SELECT h.title FROM bot_hooks h WHERE h.id = s.hook_id) AS hook_title\n`;
    sql += `FROM bot_sessions s\n`;
    sql += `WHERE s.user_id = ? AND s.bot_id = ? AND s.workspace_id IS ?\n`;

    sql += `AND ${attended_only ? followedSessionSql({ alias: "s" }) : visibleSessionSql({ alias: "s" })}\n`;

    sql += `AND (s.status = 'active' OR EXISTS (SELECT 1 FROM bot_messages m WHERE m.session_id = s.id))\n`;

    if (like) {
        sql += `AND (s.title LIKE ? ESCAPE '\\' OR s.summary LIKE ? ESCAPE '\\'\n`;
        sql += `    OR EXISTS (SELECT 1 FROM bot_messages m WHERE m.session_id = s.id AND m.text LIKE ? ESCAPE '\\'))\n`;
    }

    sql += `ORDER BY s.status = 'active' DESC, s.last_activity_at DESC, s.id DESC\n`;
    sql += `LIMIT ? OFFSET ?\n`;

    const res = await BunSQLite.sql<BotSessionListItem>({
        sql,
        values: [
            user_id,
            bot_id,
            workspace_id ? Number(workspace_id) : null,
            ...(like ? [like, like, like] : []),
            page_size,
            (Math.max(1, page) - 1) * page_size,
        ],
    });

    return res.payload || [];
}
