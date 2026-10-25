import type { BotMessageWithAttachments, ConversationHistory } from "@/src/types";

type Params = {
    /**
     * What the thread shows now.
     */
    shown: BotMessageWithAttachments[];
    history: ConversationHistory;
};

/**
 * The thread once a history lands: its messages, then any the thread
 * already has from the same session that came after them (sent or pushed
 * while the history was on its way). Everything else the thread showed
 * (an older copy of the thread, another session's) gives way to it.
 */
export default function mergeLoadedHistory({ shown, history }: Params) {
    const loaded = history.messages;
    const last_id = Number(loaded[loaded.length - 1]?.id) || 0;

    const later = shown.filter(
        (message) =>
            message.session_id == history.session.id &&
            Number(message.id) > last_id &&
            !loaded.some((m) => m.id == message.id),
    );

    return [...loaded, ...later];
}
