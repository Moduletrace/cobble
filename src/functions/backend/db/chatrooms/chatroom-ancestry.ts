import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CHATROOMS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";

type Params = {
    chatroom_id?: number | string | null;
};

/**
 * A room and the rooms it was asked from, nearest first: the chain a
 * nested request sits in. Stops past `AppData.ChatroomMaxDepth`, which is
 * as far as anything needs to look.
 */
export default async function chatroomAncestry({ chatroom_id }: Params) {
    const chain: BUN_SQLITE_COBBLE_CHATROOMS[] = [];
    let next = chatroom_id ? Number(chatroom_id) : null;

    while (next && chain.length <= AppData.ChatroomMaxDepth) {
        const room = (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_CHATROOMS>({
                sql: `SELECT * FROM chatrooms WHERE id = ? LIMIT 1`,
                values: [next],
            })
        ).payload?.[0];

        if (!room?.id || chain.some((seen) => seen.id == room.id)) break;

        chain.push(room);
        next = room.parent_chatroom_id ? Number(room.parent_chatroom_id) : null;
    }

    return chain;
}
