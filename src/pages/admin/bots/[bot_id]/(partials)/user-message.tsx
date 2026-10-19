import { useContext } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BotMessageWithAttachments } from "@/src/types";
import { BotMessageActionsContext } from "../(data)/message-actions-context";
import MessageActions from "./message-actions";
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
 * text (a file-only message has no bubble), its reactions and actions.
 */
export default function UserMessage({ message, bot_name }: Props) {
    const { onReact } = useContext(BotMessageActionsContext);

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
                    onReact={onReact}
                />
            ) : null}
            <MessageActions message={message} />
        </Stack>
    );
}
