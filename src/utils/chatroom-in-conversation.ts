import type { BUN_SQLITE_COBBLE_CHATROOMS } from "@/db/types/db";
import chatroomInPlace from "./chatroom-in-place";

type Params = {
    chatroom: Pick<BUN_SQLITE_COBBLE_CHATROOMS, "requester_bot_id" | "workspace_id" | "parent_chatroom_id">;
    bot_id: number;
    workspace_id: number | null;
};

/**
 * Whether a room was asked from a bot's conversation in a place, and not
 * from inside another room.
 */
export default function chatroomInConversation({ chatroom, bot_id, workspace_id }: Params) {
    return (
        chatroom.requester_bot_id == bot_id &&
        !chatroom.parent_chatroom_id &&
        chatroomInPlace({ chatroom, workspace_id })
    );
}
