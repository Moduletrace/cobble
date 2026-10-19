import { useContext } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BotMessageWithAttachments } from "@/src/types";
import linkComputerRefs from "@/src/utils/link-computer-refs";
import { BotMessageActionsContext } from "../(data)/message-actions-context";
import { MessageMarkdownComponents } from "../(data)/message-markdown-components";
import GroupTimestamp from "./group-timestamp";
import MessageActions from "./message-actions";
import MessageReactions from "./message-reactions";
import MessageReplyQuote from "./message-reply-quote";
import NeedsYouChip from "./needs-you-chip";
import SpeakMessageButton from "./speak-message-button";

type Props = {
    message: BotMessageWithAttachments;
    bot_name: string;
    /**
     * The group's time, on the last message only: shown beside its play
     * button.
     */
    at?: number;
};

/**
 * One bot message, rendered from markdown (GFM; raw HTML is never
 * rendered). Computers it names (`computerRef`) show as buttons that
 * switch the bot to them. A quoted reply sits above it, its reactions
 * below, and a row under it replies, reacts, reads it aloud and shows
 * why it needs you.
 */
export default function BotMessageLine({ message, bot_name, at }: Props) {
    const { onReact } = useContext(BotMessageActionsContext);
    const can_speak = Boolean(message.id && message.text?.trim());

    return (
        <Stack className="w-full min-w-0 gap-1.5! items-start max-w-full">
            {message.reply_to ? (
                <MessageReplyQuote reply_to={message.reply_to} bot_name={bot_name} />
            ) : null}
            <Stack className="w-full gap-2.5! items-start break-words">
                <Markdown
                    remarkPlugins={[remarkGfm]}
                    components={MessageMarkdownComponents}
                >
                    {linkComputerRefs({ text: message.text || "" })}
                </Markdown>
            </Stack>
            {message.id ? (
                <MessageReactions
                    message_id={message.id}
                    reactions={message.reactions}
                    onReact={onReact}
                />
            ) : null}
            <Row className="gap-2! items-center">
                {message.needs_you ? <NeedsYouChip /> : null}
                {at ? <GroupTimestamp at={at} /> : null}
                {can_speak ? <SpeakMessageButton message_id={Number(message.id)} /> : null}
                <MessageActions message={message} />
            </Row>
        </Stack>
    );
}
