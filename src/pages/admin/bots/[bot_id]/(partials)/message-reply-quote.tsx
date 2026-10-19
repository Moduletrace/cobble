import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import { Reply } from "lucide-react";
import type { BotMessageReply } from "@/src/types";
import messagePreview from "@/src/utils/message-preview";

type Props = {
    reply_to: BotMessageReply;
    bot_name: string;
    /**
     * Right-align it, for a user message.
     */
    align_end?: boolean;
};

/**
 * The message a reply answers: who wrote it and a one-line preview. A
 * file-only message says so instead of showing an empty line.
 */
export default function MessageReplyQuote({ reply_to, bot_name, align_end }: Props) {
    const preview = messagePreview({ text: reply_to.text }) || "A file";

    return (
        <Stack
            className={`w-full max-w-[80%] min-w-0 gap-0.5! overflow-hidden border-0 border-l-2 border-solid border-hairline-strong pl-2.5 ${
                align_end ? "items-end text-right" : "items-start"
            }`}
        >
            <Row className="max-w-full min-w-0 gap-1! items-center">
                <Reply size={11} aria-hidden className="shrink-0 text-ink-secondary" />
                <Span className="min-w-0 truncate text-[11px] font-bold leading-4 text-ink">
                    {reply_to.author == "user" ? "You" : bot_name}
                </Span>
            </Row>
            <Span className="block w-full max-w-full break-words text-xs leading-4 text-ink-secondary line-clamp-2">
                {preview}
            </Span>
        </Stack>
    );
}
