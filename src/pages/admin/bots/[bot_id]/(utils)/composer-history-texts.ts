import type { BotMessageWithAttachments } from "@/src/types";
import isCrewMessage from "@/src/utils/is-crew-message";

/**
 * A message the Up arrow can recall: only what the user typed here. A
 * crew request's outcome and an install request's answer are stored on the
 * user's side, but the user wrote neither.
 */
export type ComposerHistoryMessage = Pick<
    BotMessageWithAttachments,
    "author" | "text" | "from_ask_id" | "from_install_request_id"
>;

/**
 * What the user typed, oldest first, so the newest message Up recalls is
 * its last entry.
 */
export default function composerHistoryTexts({
    messages,
}: {
    messages: ComposerHistoryMessage[];
}) {
    const texts: string[] = [];

    for (const message of messages) {
        if (message.author != "user" || isCrewMessage({ message })) continue;

        const text = message.text?.trim();

        if (text) texts.push(text);
    }

    return texts;
}