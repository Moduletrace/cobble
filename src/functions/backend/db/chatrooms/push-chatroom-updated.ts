import { logError } from "@/src/functions/backend/logger";
import { sendToUser } from "@/src/websocket/(functions)/send-to-user";
import grabChatroom from "./grab-chatroom";
import chatroomSummaries from "./chatroom-summaries";

type Params = {
    chatroom_id: number | string;
};

/**
 * Pushes a room as it is now (`server:chatroom-updated`) to its user's
 * open tabs, for the rail and the room's header. Best effort.
 */
export default async function pushChatroomUpdated({ chatroom_id }: Params) {
    try {
        const room = await grabChatroom({ chatroom_id });

        if (!room?.id || !room.user_id) return;

        const [summary] = await chatroomSummaries({ chatrooms: [room] });

        if (summary) {
            sendToUser({ user_id: room.user_id, data: { event: "server:chatroom-updated", data: summary } });
        }
    } catch (error) {
        await logError({ title: "Chatroom update wasn't pushed", error, metadata: { chatroom_id } }).catch(() => {});
    }
}
