import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import ChatroomStone from "@/src/components/general/chatroom-stone";
import type { ChatroomBot } from "@/src/types";

type Props = {
    bot: ChatroomBot;
    /**
     * What it does in the room: asked, passes it on, was asked.
     */
    part: string;
};

/**
 * One bot of the room with its part in it.
 */
export default function ChatroomBotsRow({ bot, part }: Props) {
    return (
        <Row className="gap-2! flex-nowrap items-center">
            <ChatroomStone bot={bot} size={18} />
            <Span className="text-[13px] font-bold leading-4 text-ink">{bot.name || "A bot"}</Span>
            <Span className="text-[13px] leading-4 text-ink-secondary">{part}</Span>
        </Row>
    );
}
