import Stack from "@moduletrace/twui/layout/Stack";
import type { BotWithLastMessage } from "@/src/types";
import type { MessageGroup } from "../(utils)/group-messages";
import UserMessage from "./user-message";

type Props = {
    bot: BotWithLastMessage;
    group: MessageGroup;
};

/**
 * Right-aligned ink bubbles (each message's files above it), each with
 * its own copy button and time under it, so two messages sent close
 * together never share one.
 */
export default function UserMessageGroup({ bot, group }: Props) {
    return (
        <Stack className="w-full gap-1! items-end">
            {group.messages.map((message) => (
                <UserMessage key={message.id} message={message} bot_name={bot.name || "the bot"} />
            ))}
        </Stack>
    );
}
