import type { BotMessageWithAttachments } from "@/src/types";

export type MessageGroup = {
    key: string;
    author: "bot" | "user";
    messages: BotMessageWithAttachments[];
    /**
     * Time of the group's last message, shown once per group.
     */
    at: number;
    /**
     * The first group of a later session than the one above it (an
     * earlier session opened above the thread): a divider goes above it.
     */
    starts_session?: boolean;
};

type Params = {
    messages: BotMessageWithAttachments[];
    /**
     * Consecutive messages from one author within this gap share a group.
     */
    gap_ms?: number;
};

/**
 * Splits a conversation (oldest first) into author groups. A group never
 * spans two sessions.
 */
export default function groupMessages({
    messages,
    gap_ms = 5 * 60 * 1000,
}: Params): MessageGroup[] {
    const groups: MessageGroup[] = [];

    for (const message of messages) {
        const author = message.author === "user" ? "user" : "bot";
        const at = Number(message.created_at || 0);
        const last = groups[groups.length - 1];

        const last_session = last?.messages[last.messages.length - 1]?.session_id;
        const new_session = Boolean(
            last && message.session_id && last_session && message.session_id != last_session,
        );

        if (last && !new_session && last.author === author && at - last.at <= gap_ms) {
            last.messages.push(message);
            last.at = at;
            continue;
        }

        groups.push({
            key: String(message.id),
            author,
            messages: [message],
            at,
            starts_session: new_session || undefined,
        });
    }

    return groups;
}
