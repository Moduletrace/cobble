import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";

export type MessageGroup = {
    key: string;
    author: "bot" | "user";
    messages: BUN_SQLITE_COBBLE_BOT_MESSAGES[];
    /**
     * Time of the group's last message, shown once per group.
     */
    at: number;
};

type Params = {
    messages: BUN_SQLITE_COBBLE_BOT_MESSAGES[];
    /**
     * Consecutive messages from one author within this gap share a group.
     */
    gap_ms?: number;
};

/**
 * Splits a conversation (oldest first) into author groups.
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

        if (last && last.author === author && at - last.at <= gap_ms) {
            last.messages.push(message);
            last.at = at;
            continue;
        }

        groups.push({
            key: String(message.id),
            author,
            messages: [message],
            at,
        });
    }

    return groups;
}
