import Link from "@moduletrace/twui/layout/Link";
import { MessagesSquare } from "lucide-react";

type Props = {
    chatroom_id: number;
};

/**
 * A chatroom named in a message (`chatroomRef`): a chip that opens the
 * room, where the request and everything said about it is kept (a
 * workspace's room is sent on to its page inside the workspace).
 */
export default function ChatroomRefChip({ chatroom_id }: Props) {
    return (
        <Link
            href={`/admin/chatrooms/${chatroom_id}`}
            title="Open the chatroom"
            className="inline-flex h-6 gap-1.5 items-center px-1.5 align-middle rounded-default-xs border-0 bg-sunken text-[13px] font-bold leading-4 text-ink whitespace-nowrap hover:opacity-80"
        >
            <MessagesSquare size={13} aria-hidden />
            {`Chatroom ${chatroom_id}`}
        </Link>
    );
}
