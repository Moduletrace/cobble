import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_SESSIONS, BUN_SQLITE_COBBLE_CHATROOMS, BunSQLiteTables } from "@/db/types/db";

type Params = {
    chatroom: Pick<BUN_SQLITE_COBBLE_CHATROOMS, "id" | "user_id" | "workspace_id" | "title">;
    bot_id: number | string;
};

/**
 * A bot's part of a chatroom: its session there (status `chatroom`), made
 * the first time it takes part. It holds the bot's messages and jobs in
 * the room and never shows in the bot's own conversation.
 */
export default async function ensureChatroomSession({
    chatroom,
    bot_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_SESSIONS> {
    const found = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS>({
            sql: `SELECT * FROM bot_sessions WHERE chatroom_id = ? AND bot_id = ? LIMIT 1`,
            values: [chatroom.id!, bot_id],
        })
    ).payload?.[0];

    if (found?.id) return found;

    const now = Date.now();
    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_BOT_SESSIONS, (typeof BunSQLiteTables)[number]>({
        table: "bot_sessions",
        data: [
            {
                user_id: chatroom.user_id,
                bot_id: Number(bot_id),
                workspace_id: chatroom.workspace_id || undefined,
                chatroom_id: chatroom.id,
                status: "chatroom",
                title: chatroom.title || undefined,
                last_activity_at: now,
            },
        ],
    });

    const id = res.postInsertReturn?.insertId;

    if (!res.success || !id) {
        throw new Error(`Couldn't start the bot's part of the chatroom: ${res.msg}`);
    }

    return (
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS>({
                sql: `SELECT * FROM bot_sessions WHERE id = ? LIMIT 1`,
                values: [id],
            })
        ).payload?.[0] || { id, user_id: chatroom.user_id, bot_id: Number(bot_id), chatroom_id: chatroom.id, status: "chatroom" }
    );
}
