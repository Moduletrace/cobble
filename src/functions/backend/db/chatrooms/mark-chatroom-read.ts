import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    chatroom_id: number | string;
    user_id: number | string;
};

/**
 * Marks one of the user's rooms read, as opening it does.
 */
export default async function markChatroomRead({ chatroom_id, user_id }: Params) {
    await BunSQLite.sql({
        sql: `UPDATE chatrooms SET unread = 0 WHERE id = ? AND user_id = ? AND unread = 1`,
        values: [chatroom_id, user_id],
    });
}
