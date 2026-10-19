import Stack from "@moduletrace/twui/layout/Stack";
import type {
    BotMessageWithAttachments,
    BotWithLastMessage,
} from "@/src/types";
import groupMessages from "../(utils)/group-messages";
import BotThinkingRow from "./bot-thinking-row";
import MessageGroupBlock from "./message-group-block";

type Props = {
    bot: BotWithLastMessage;
    messages: BotMessageWithAttachments[];
    /**
     * The latest step of the bot's active task, shown while it works.
     */
    progress?: string | null;
    /**
     * The latest step of the reply running here, shown while it thinks.
     */
    reply_progress?: string | null;
    /**
     * This session has an active task.
     */
    has_task?: boolean;
};

/**
 * Bottom-anchored: the stack sits 24px above the composer rule and grows
 * upward. Empty space belongs at the top. New messages announce politely.
 * While the bot works on a reply or a task, a status row sits under the
 * last one.
 */
export default function MessageThread({ bot, messages, progress, reply_progress, has_task }: Props) {
    const groups = groupMessages({ messages });

    return (
        <Stack className="grow min-h-0 gap-0! items-stretch overflow-y-auto flex-col-reverse">
            <Stack
                role="log"
                aria-live="polite"
                aria-label={`Conversation with ${bot.name}`}
                className="w-full max-w-container mx-auto gap-4! items-stretch px-3 md:px-6 pt-6 pb-6"
            >
                {groups.map((group) => (
                    <MessageGroupBlock
                        key={group.key}
                        bot={bot}
                        group={group}
                    />
                ))}
                <BotThinkingRow
                    bot={bot}
                    progress={progress}
                    reply_progress={reply_progress}
                    awaiting_reply={messages[messages.length - 1]?.author == "user"}
                    has_task={has_task}
                />
            </Stack>
        </Stack>
    );
}
