import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import type { ChatroomSummary } from "@/src/types";

type Params = {
    /**
     * The thread's last message.
     */
    last_message?: Pick<BUN_SQLITE_COBBLE_BOT_MESSAGES, "from_chatroom_id"> | null;
    chatrooms: Pick<ChatroomSummary, "id" | "status">[];
};

/**
 * Whether the thread's last word is a chatroom's that no reply follows,
 * though it sits on the user's side: the room was stopped, which doesn't
 * wake the bot, or it's running again and its answer is what comes next.
 */
export default function chatroomHoldsReply({ last_message, chatrooms }: Params) {
    if (!last_message?.from_chatroom_id) return false;

    const status = chatrooms.find((room) => room.id == last_message.from_chatroom_id)?.status;

    return status == "stopped" || status == "open";
}
