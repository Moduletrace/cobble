import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { twMerge } from "tailwind-merge";
import ChatroomStone from "@/src/components/general/chatroom-stone";
import type { ChatroomSummary } from "@/src/types";
import chatroomStatusLine from "@/src/utils/chatroom-status-line";

type Props = {
    chatroom: ChatroomSummary;
    href: string;
    selected?: boolean;
};

/**
 * A chatroom in the rail, the same 48px row as a bot: the asking bot's
 * stone, the request and where it stands. Unread is said in words.
 */
export default function RailChatroomRow({ chatroom, href, selected }: Props) {
    const requester = chatroom.bots[0];

    return (
        <Link
            href={href}
            aria-current={selected ? "page" : undefined}
            title={chatroom.title || "Chatroom"}
            className={twMerge(
                "flex shrink-0 h-12 items-center gap-3 rounded-default px-1 @rail:px-3 border-0 leading-normal text-ink",
                "hover:opacity-100 hover:bg-sunken transition-colors duration-[var(--m-fast)]",
                "focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                selected && "bg-ink/5 hover:bg-ink/5",
            )}
        >
            <Span className="mx-auto @rail:mx-0 inline-flex shrink-0">
                {requester ? <ChatroomStone bot={requester} size={28} /> : null}
            </Span>
            <Stack className="hidden @rail:flex grow min-w-0 gap-0!">
                <Span className="text-sm font-bold leading-5 text-ink truncate w-full">
                    {chatroom.title || "A request"}
                </Span>
                <Span className="text-xs leading-4 text-ink-secondary truncate w-full">
                    {chatroom.unread ? "New messages" : chatroomStatusLine(chatroom)}
                </Span>
            </Stack>
        </Link>
    );
}
