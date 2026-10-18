import Stack from "@moduletrace/twui/layout/Stack";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import type { BotWithLastMessage } from "@/src/types";
import groupMessages from "../(utils)/group-messages";
import MessageGroupBlock from "./message-group-block";

type Props = {
    bot: BotWithLastMessage;
    messages: BUN_SQLITE_COBBLE_BOT_MESSAGES[];
};

/**
 * Bottom-anchored: the stack sits 24px above the composer rule and grows
 * upward. Empty space belongs at the top. New messages announce politely.
 */
export default function MessageThread({ bot, messages }: Props) {
    const groups = groupMessages({ messages });

    return (
        <Stack className="grow min-h-0 gap-0! items-stretch overflow-y-auto flex-col-reverse">
            <Stack
                role="log"
                aria-live="polite"
                aria-label={`Conversation with ${bot.name}`}
                className="w-full gap-4! items-stretch px-6 pt-6 pb-6"
            >
                {groups.map((group) => (
                    <MessageGroupBlock key={group.key} bot={bot} group={group} />
                ))}
            </Stack>
        </Stack>
    );
}
