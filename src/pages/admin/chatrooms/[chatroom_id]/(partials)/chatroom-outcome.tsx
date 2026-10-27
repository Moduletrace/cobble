import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { ChatroomSummary } from "@/src/types";
import chatroomStatusLine from "@/src/utils/chatroom-status-line";
import linkComputerRefs from "@/src/utils/link-computer-refs";
import { MessageMarkdownComponents } from "@/src/pages/admin/bots/[bot_id]/(data)/message-markdown-components";

const RemarkPlugins = [remarkGfm];

type Props = {
    chatroom: ChatroomSummary;
};

/**
 * How a closed room ended and what went back to the bot that asked.
 */
export default function ChatroomOutcome({ chatroom }: Props) {
    if (chatroom.status == "open") return null;

    return (
        <Stack className="w-full gap-2! items-start rounded-default border border-solid border-hairline bg-surface px-4 py-3">
            <Span className="text-[11px] font-bold uppercase tracking-wide leading-4 text-ink-secondary">
                {chatroomStatusLine(chatroom)}
            </Span>
            {chatroom.outcome?.trim() ? (
                <Stack className="w-full gap-2.5! items-start break-words">
                    <Markdown remarkPlugins={RemarkPlugins} components={MessageMarkdownComponents}>
                        {linkComputerRefs({ text: chatroom.outcome })}
                    </Markdown>
                </Stack>
            ) : null}
        </Stack>
    );
}
