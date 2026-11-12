import { AppData } from "@/src/data/app-data";
import type { BotMessageWithAttachments } from "@/src/types";

type Params = {
    /**
     * The conversation a reply reads, oldest first.
     */
    messages: BotMessageWithAttachments[];
    /**
     * How many messages with files may hand their files over
     * (`AppData.BotReplyAttachmentMessages`).
     */
    max_messages?: number;
    /**
     * How far back a file may be and still be handed over
     * (`AppData.BotReplyAttachmentMaxAgeMessages`).
     */
    max_age?: number;
};

/**
 * The messages whose attached files a reply gets as the files themselves,
 * oldest first. Two limits, both needed: only the latest few messages with
 * files (`max_messages`), and only while the conversation hasn't moved
 * far past them (`max_age`).
 *
 * The age bound is what keeps one upload from being re-attached, and so
 * re-read by the media reading harness, on every reply for the rest of a
 * long session (a screenshot 25 messages back was read once per reply, a
 * vision call of a minute each time). Past it the file is only named
 * (`botMessagesToHarness`), so the bot still knows it was sent.
 */
export default function liveAttachmentMessages({
    messages,
    max_messages = AppData.BotReplyAttachmentMessages,
    max_age = AppData.BotReplyAttachmentMaxAgeMessages,
}: Params): number[] {
    const oldest_allowed = messages.length - Math.max(0, max_age);

    return messages
        .map((message, index) => ({ message, index }))
        .filter(({ message, index }) => index >= oldest_allowed && Boolean(message.attachments?.length))
        .slice(-Math.max(0, max_messages))
        .map(({ message }) => Number(message.id));
}
