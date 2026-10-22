import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BotWithLastMessage } from "@/src/types";
import copyableMessages from "../(utils)/copyable-messages";
import type { MessageGroup } from "../(utils)/group-messages";
import UserMessage from "./user-message";
import UserMessageCopy from "./user-message-copy";
import GroupTimestamp from "./group-timestamp";

type Props = {
    bot: BotWithLastMessage;
    group: MessageGroup;
};

/**
 * Right-aligned ink bubbles (each message's files above it), then one
 * row under the group: a copy button per message with text, left of the
 * group's time.
 */
export default function UserMessageGroup({ bot, group }: Props) {
    const copyable = copyableMessages({ messages: group.messages });

    return (
        <Stack className="w-full gap-1! items-end">
            {group.messages.map((message) => (
                <UserMessage key={message.id} message={message} bot_name={bot.name || "the bot"} />
            ))}
            <Row className="gap-3! items-center">
                {copyable.map((message) => (
                    <UserMessageCopy key={message.id} text={message.text || ""} />
                ))}
                <GroupTimestamp at={group.at} />
            </Row>
        </Stack>
    );
}
