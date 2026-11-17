import type { BotMessageWithAttachments } from "@/src/types";

type Params = {
    messages: BotMessageWithAttachments[];
    /**
     * The bot message the user asked to run again, while its answer is on
     * its way. A stopped run's notice left in the thread would sit above the
     * thinking row saying the bot stopped, so it is left out until the run
     * ends and takes its place back above the answer it writes. Their own
     * message asked again stays: they need to see what is being answered.
     */
    rerun_message_id?: number | null;
};

/**
 * The thread as it is shown: every message, but not the bot's one being run
 * again while that run works.
 */
export default function threadMessages({
    messages,
    rerun_message_id,
}: Params): BotMessageWithAttachments[] {
    if (rerun_message_id == null) return messages;

    return messages.filter(
        (message) =>
            message.author != "bot" || Number(message.id) != rerun_message_id,
    );
}