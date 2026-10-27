import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import { sendToUser } from "@/src/websocket/(functions)/send-to-user";
import grabChatroom from "./grab-chatroom";
import pushChatroomUpdated from "./push-chatroom-updated";

type Params = {
    chatroom_id: number | string;
    message: BUN_SQLITE_COBBLE_BOT_MESSAGES;
};

/**
 * Pushes a message posted in a room (`server:chatroom-message`) and the
 * room as it is now to the room's user.
 */
export default async function pushChatroomMessage({ chatroom_id, message }: Params) {
    const room = await grabChatroom({ chatroom_id });

    if (!room?.id || !room.user_id) return;

    sendToUser({
        user_id: room.user_id,
        data: { event: "server:chatroom-message", data: { chatroom_id: Number(room.id), message } },
    });

    await pushChatroomUpdated({ chatroom_id: room.id });
}
