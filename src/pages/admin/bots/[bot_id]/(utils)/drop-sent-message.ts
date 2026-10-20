import type { BotMessageWithAttachments } from "@/src/types";

type Params = {
    /**
     * Messages shown before the server has them.
     */
    pending: BotMessageWithAttachments[];
    /**
     * The saved message that has arrived, from the send's response or a
     * push.
     */
    message: BotMessageWithAttachments;
};

/**
 * Takes a pending message off the thread once the saved one arrives, so a
 * pushed copy never shows beside the bubble still waiting for its
 * response. Only user messages can be pending. The first one that matches
 * is enough: same text, same quote, same number of files.
 */
export default function dropSentMessage({ pending, message }: Params): BotMessageWithAttachments[] {
    if (!pending.length || message.author != "user") return pending;

    const index = pending.findIndex(
        (item) =>
            item.text == message.text &&
            (item.reply_to?.id || null) == (message.reply_to_message_id || null) &&
            (item.attachments?.length || 0) == (message.attachments?.length || 0),
    );

    if (index < 0) return pending;

    return [...pending.slice(0, index), ...pending.slice(index + 1)];
}
