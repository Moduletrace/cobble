import { memo, useContext } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BotMessageWithAttachments } from "@/src/types";
import linkComputerRefs from "@/src/utils/link-computer-refs";
import { BotMessageActionsContext } from "../(data)/message-actions-context";
import { MessageMarkdownComponents } from "../(data)/message-markdown-components";
import { QuotableAttribute } from "../(hooks)/use-message-selection";
import CarriedOverChip from "./carried-over-chip";
import GroupTimestamp from "./group-timestamp";
import MessageActions from "./message-actions";
import MessageReactions from "./message-reactions";
import MessageReplyQuote from "./message-reply-quote";
import MessageUsageChip from "./message-usage-chip";
import NeedsYouChip from "./needs-you-chip";
import SpeakMessageButton from "./speak-message-button";

/**
 * Kept module-level: a new array on every render makes `react-markdown`
 * parse the message again.
 */
const RemarkPlugins = [remarkGfm];

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
 * rendered). The summary opening a session the bot moved into is
 * headed by a link to the session it carries on from. Computers it names (`computerRef`) show as buttons that
 * switch the bot to them. A quoted reply sits above it, its reactions
 * below, and a row under it replies, reacts, reads it aloud and shows
 * why it needs you. Its text can be selected and quoted.
 *
 * Memoized: a message only renders (and parses its markdown) again when
 * it changes, not on every live step of the thread.
 */
function BotMessageLine({ message, bot_name, at }: Props) {
    const { onReact } = useContext(BotMessageActionsContext);
    const can_speak = Boolean(message.id && message.text?.trim());

    return (
        <Stack className="w-full min-w-0 gap-1.5! items-start max-w-full">
            {message.carried_from_session_id && message.bot_id ? (
                <CarriedOverChip
                    bot_id={message.bot_id}
                    workspace_id={message.workspace_id}
                    session_id={message.carried_from_session_id}
                />
            ) : null}
            {message.reply_to ? (
                <MessageReplyQuote
                    reply_to={message.reply_to}
                    bot_name={bot_name}
                />
            ) : null}
            <Stack
                {...{ [QuotableAttribute]: "" }}
                className="w-full gap-2.5! items-start break-words"
            >
                <Markdown
                    remarkPlugins={RemarkPlugins}
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
            <Row className="gap-3! items-center">
                {message.needs_you ? <NeedsYouChip /> : null}
                {at ? <GroupTimestamp at={at} /> : null}
                <MessageUsageChip usage={message.usage} />
                {can_speak ? (
                    <SpeakMessageButton message_id={Number(message.id)} />
                ) : null}
                <MessageActions message={message} />
            </Row>
        </Stack>
    );
}

export default memo(BotMessageLine);
