import type { ChatroomSummary } from "@/src/types";

type Params = {
    chatrooms: ChatroomSummary[];
    chatroom: ChatroomSummary;
};

/**
 * A list of rooms with one room as it is now: replaced, or added when it's
 * new, then open rooms first and the latest activity next, as the server
 * orders them.
 */
export default function mergeChatroom({ chatrooms, chatroom }: Params): ChatroomSummary[] {
    const others = chatrooms.filter((room) => room.id != chatroom.id);
    const at = (room: ChatroomSummary) => Number(room.last_activity_at || room.created_at || 0);

    return [...others, chatroom].sort(
        (a, b) =>
            Number(b.status == "open") - Number(a.status == "open") || at(b) - at(a) || Number(b.id) - Number(a.id),
    );
}
