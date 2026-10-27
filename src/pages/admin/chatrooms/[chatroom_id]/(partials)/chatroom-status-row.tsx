import { twMerge } from "tailwind-merge";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import ChatroomStone from "@/src/components/general/chatroom-stone";
import type { ChatroomBotStatus } from "@/src/utils/chatroom-bot-statuses";

/**
 * Where one bot of an open room stands, with its latest step while it
 * works.
 */
export default function ChatroomStatusRow({ bot, label, detail, active }: ChatroomBotStatus) {
    return (
        <Row className="w-full gap-3! flex-nowrap items-center">
            <ChatroomStone bot={bot} size={24} face={active ? "working" : "idle"} />
            <Stack className="min-w-0 gap-0! items-start">
                <Span
                    className={twMerge(
                        "text-sm leading-5 text-ink-secondary",
                        active && "animate-pulse motion-reduce:animate-none",
                    )}
                >
                    {label}
                </Span>
                {detail ? (
                    <Span className="w-full text-xs leading-4 text-ink-secondary truncate">{detail}</Span>
                ) : null}
            </Stack>
        </Row>
    );
}
