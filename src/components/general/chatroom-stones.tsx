import Row from "@moduletrace/twui/layout/Row";
import { twMerge } from "tailwind-merge";
import type { ChatroomBot } from "@/src/types";
import ChatroomStone from "./chatroom-stone";

type Props = {
    bots: ChatroomBot[];
    size?: number;
    className?: string;
};

/**
 * The bots in a chatroom side by side, asking bot first: stones never
 * overlap, sit in a badge or get an outline.
 */
export default function ChatroomStones({ bots, size = 18, className }: Props) {
    return (
        <Row className={twMerge("shrink-0 gap-1! flex-nowrap items-center", className)}>
            {bots.map((bot) => (
                <ChatroomStone key={bot.id} bot={bot} size={size} />
            ))}
        </Row>
    );
}
