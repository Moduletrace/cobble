import type { ChatroomSummary } from "@/src/types";
import chatroomSummaries from "./chatroom-summaries";
import grabChatroom from "./grab-chatroom";

type Params = {
    chatroom_id: number | string;
    user_id: number | string;
};

/**
 * One of the user's own chatrooms with the bots in it, or null.
 */
export default async function grabUserChatroom({ chatroom_id, user_id }: Params): Promise<ChatroomSummary | null> {
    const room = await grabChatroom({ chatroom_id, user_id });

    if (!room?.id) return null;

    return (await chatroomSummaries({ chatrooms: [room] }))[0] || null;
}
