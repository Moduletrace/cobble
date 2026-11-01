import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import ChatroomStatus from "@/src/pages/admin/chatrooms/[chatroom_id]/(sections)/chatroom-status";
import type { ChatroomSummary } from "@/src/types";
import chatroomHref from "@/src/utils/chatroom-href";

type Props = {
    room: ChatroomSummary;
};

/**
 * One open request: what was asked and where each bot in it stands, the
 * whole of it a link to the room.
 */
export default function ConversationChatroomRow({ room }: Props) {
    return (
        <Link
            href={chatroomHref({ chatroom: room })}
            title="Open the chatroom"
            className="block w-full border-0 rounded-default px-3 py-2 leading-normal hover:opacity-100 hover:bg-sunken transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink"
        >
            <Span className="block text-[11px] font-bold uppercase tracking-wide leading-4 text-ink-secondary truncate">
                {room.title || "A request"}
            </Span>
            <ChatroomStatus room={room} />
        </Link>
    );
}
