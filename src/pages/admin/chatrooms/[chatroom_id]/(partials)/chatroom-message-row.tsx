import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import ChatroomStone from "@/src/components/general/chatroom-stone";
import type { BotMessageWithAttachments, ChatroomBot } from "@/src/types";
import linkComputerRefs from "@/src/utils/link-computer-refs";
import relativeTime from "@/src/utils/relative-time";
import { MessageMarkdownComponents } from "@/src/pages/admin/bots/[bot_id]/(data)/message-markdown-components";
import MessageDetailsModal from "@/src/pages/admin/bots/[bot_id]/(partials)/message-details-modal";
import MessageUsageChip from "@/src/pages/admin/bots/[bot_id]/(partials)/message-usage-chip";

/**
 * Kept module-level: a new array on every render makes `react-markdown`
 * parse the message again.
 */
const RemarkPlugins = [remarkGfm];

type Props = {
    message: BotMessageWithAttachments;
    /**
     * The bot that posted it, null once it was deleted.
     */
    bot?: ChatroomBot | null;
    /**
     * The room it was posted in, for its details (they're read from the
     * room's own route).
     */
    chatroom_id: number;
};

/**
 * One message in a chatroom, under the stone and name of the bot that
 * posted it, rendered from markdown like a conversation's (raw HTML
 * never), with what it spent and its details underneath. Rooms are
 * records: nothing here replies or reacts.
 */
export default function ChatroomMessageRow({ message, bot, chatroom_id }: Props) {
    return (
        <Row className="w-full gap-3! flex-nowrap items-start">
            <Span className="inline-flex shrink-0 -mt-0.5">
                {bot ? <ChatroomStone bot={bot} size={28} /> : null}
            </Span>
            <Stack className="min-w-0 grow gap-1! items-start">
                <Row className="gap-2! flex-nowrap items-baseline">
                    <Span className="text-sm font-bold leading-5 text-ink">{bot?.name || "A removed bot"}</Span>
                    <Span className="text-[11px] leading-4 text-ink-secondary">
                        {relativeTime({ at: Number(message.created_at || 0) })}
                    </Span>
                </Row>
                <Stack className="w-full gap-2.5! items-start break-words">
                    <Markdown remarkPlugins={RemarkPlugins} components={MessageMarkdownComponents}>
                        {linkComputerRefs({ text: message.text || "" })}
                    </Markdown>
                </Stack>
                <Row className="w-full gap-1! flex-nowrap items-center">
                    <MessageUsageChip usage={message.usage} />
                    <MessageDetailsModal
                        message_id={Number(message.id)}
                        tool_log={message.tool_log}
                        chatroom_id={chatroom_id}
                    />
                </Row>
            </Stack>
        </Row>
    );
}
