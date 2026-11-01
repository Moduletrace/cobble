import type { BUN_SQLITE_COBBLE_CHATROOMS } from "@/db/types/db";
import { ChatroomRetryableStatuses, type ChatroomStatus } from "@/src/dict/chatroom-dict";

type Params = {
    chatroom: Pick<BUN_SQLITE_COBBLE_CHATROOMS, "status">;
};

/**
 * Whether a room ended in a way the user can try again.
 */
export default function canRetryChatroom({ chatroom }: Params) {
    return ChatroomRetryableStatuses.includes(chatroom.status as ChatroomStatus);
}
