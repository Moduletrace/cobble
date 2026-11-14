import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    user_id: number | string;
    /**
     * The bot answering it.
     */
    bot_id: number | string;
    /**
     * The place the conversation is in; none for the bot's own chat, which
     * shows a request from any place.
     */
    workspace_id?: number | string | null;
};

export type ConversationAsk = {
    ask_id: number;
    title: string | null;
    requester_name: string | null;
    /**
     * The place the request came from: its brief and answer are in that
     * workspace's conversation with this bot, not in its own chat.
     */
    workspace_name: string | null;
    /**
     * The session the answer runs in, and its place, so the row can open the
     * conversation it can't show itself.
     */
    session_id: number | null;
    workspace_id: number | null;
};

/**
 * The crew request the bot is answering for this user, if one is open. Its
 * answer runs in a hidden session, so without this the thread would show
 * nothing at all while the bot's stone says it's working: the row under the
 * last message reads this to say who it's answering.
 */
export default async function grabConversationAsk({
    user_id,
    bot_id,
    workspace_id,
}: Params): Promise<ConversationAsk | null> {
    const place = workspace_id ? "AND a.workspace_id = ?" : "";
    const values = workspace_id
        ? [user_id, bot_id, workspace_id]
        : [user_id, bot_id];

    const res = await BunSQLite.sql({
        sql: `SELECT a.id, a.title, a.session_id, a.workspace_id,
                   b.name AS requester_name, w.name AS workspace_name
            FROM bot_asks a
            LEFT JOIN bots b ON b.id = a.requester_bot_id
            LEFT JOIN workspaces w ON w.id = a.workspace_id
            WHERE a.user_id = ? AND a.target_bot_id = ? AND a.status = 'working' ${place}
            ORDER BY a.id DESC
            LIMIT 1`,
        values,
    });

    const [row] = res.payload || [];

    if (!row) return null;

    return {
        ask_id: Number(row.id),
        title: row.title ? String(row.title) : null,
        requester_name: row.requester_name ? String(row.requester_name) : null,
        workspace_name: row.workspace_name ? String(row.workspace_name) : null,
        session_id: row.session_id ? Number(row.session_id) : null,
        workspace_id: row.workspace_id ? Number(row.workspace_id) : null,
    };
}
