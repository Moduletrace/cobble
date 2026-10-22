import { memo } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BotMessageWithAttachments } from "@/src/types";
import CopyMessageButton from "./copy-message-button";
import MessageAttachments from "./message-attachments";
import MessageReactions from "./message-reactions";
import MessageReplyQuote from "./message-reply-quote";
import UserBubble from "./user-bubble";

type Props = {
    message: BotMessageWithAttachments;
    bot_name: string;
};

/**
 * One user message: the quoted message it answers, its files, then its
 * text (a file-only message has no bubble) and the bot's reactions to it.
 * The user doesn't reply to or react to their own messages, but they can
 * copy one. Memoized, like `BotMessageLine`.
 */
function UserMessage({ message, bot_name }: Props) {
    return (
        <Stack className="w-full min-w-0 max-w-full items-end gap-1.5!">
            {message.reply_to ? (
                <MessageReplyQuote
                    reply_to={message.reply_to}
                    bot_name={bot_name}
                    align_end
                />
            ) : null}
            <MessageAttachments attachments={message.attachments} />
            {message.text ? <UserBubble text={message.text} /> : null}
            {message.id ? (
                <MessageReactions
                    message_id={message.id}
                    reactions={message.reactions}
                />
            ) : null}
            {message.text ? (
                <Row className="gap-3! items-center">
                    <CopyMessageButton text={message.text} />
                </Row>
            ) : null}
        </Stack>
    );
}

export default memo(UserMessage);
