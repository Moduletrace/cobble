import type { BotMessageWithAttachments } from "@/src/types";

/**
 * The messages of a group that can be copied: a file-only message has no
 * text, and its copy button renders nothing, so it would only leave a
 * gap in the row.
 */
export default function copyableMessages({
    messages,
}: {
    messages: BotMessageWithAttachments[];
}): BotMessageWithAttachments[] {
    return messages.filter((message) => Boolean(message.text?.trim()));
}
