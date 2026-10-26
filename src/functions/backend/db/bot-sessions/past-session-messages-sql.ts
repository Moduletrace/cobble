import { AppData } from "@/src/data/app-data";

/**
 * Which earlier sessions are read: one user's conversation with one bot,
 * in its own chat or one workspace, without the session being answered.
 */
export type PastSessionScope = {
    user_id: number | string;
    bot_id: number | string;
    workspace_id?: number | string | null;
    /**
     * The session the bot is answering in: its messages are already in
     * the prompt.
     */
    current_session_id: number | string;
};

export type SearchPastSessionsParams = PastSessionScope & {
    /**
     * Words to find in the messages; every one must be there.
     */
    query: string;
    /**
     * Only messages older than this one (paging).
     */
    before_id?: number | string | null;
    limit?: number;
    snippet_chars?: number;
};

/**
 * Finds messages of the conversation's earlier sessions, newest first,
 * with their session's title and the text around the first word's match
 * (cut in SQL). Every word must match, in any case; `%` and `_` match
 * only themselves.
 */
export default function searchPastSessionsSql({
    user_id,
    bot_id,
    workspace_id,
    current_session_id,
    query,
    before_id,
    limit = AppData.PastSessionSearchLimit,
    snippet_chars = AppData.PastSessionSnippetChars,
}: SearchPastSessionsParams) {
    const words = query.trim().split(/\s+/).filter(Boolean).slice(0, 8);
    const first = words[0] || "";
    const lead = Math.floor(snippet_chars / 3);

    const values: (string | number | null)[] = [
        first,
        lead,
        snippet_chars,
        Number(user_id),
        Number(bot_id),
        workspace_id ? Number(workspace_id) : null,
        Number(current_session_id),
    ];
    const where = [
        `s.user_id = ?`,
        `s.bot_id = ?`,
        `s.workspace_id IS ?`,
        `s.id != ?`,
    ];

    for (const word of words) {
        where.push(`m.text LIKE ? ESCAPE '\\'`);
        values.push(`%${word.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
    }

    if (before_id) {
        where.push(`m.id < ?`);
        values.push(Number(before_id));
    }

    values.push(Math.min(Math.max(Math.floor(limit) || 1, 1), 100));

    return {
        sql: `SELECT m.id, m.session_id, m.author, m.created_at, s.title AS session_title,
                substr(m.text, max(1, instr(lower(m.text), lower(?)) - ?), ?) AS snippet
            FROM bot_messages m JOIN bot_sessions s ON s.id = m.session_id
            WHERE ${where.join(" AND ")}
            ORDER BY m.id DESC
            LIMIT ?`,
        values,
    };
}
