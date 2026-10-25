import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import type { TokenUsageSummary } from "@/src/harness/usage/types";
import grabMessageUsage from "./grab-message-usage";

type Params<T extends BUN_SQLITE_COBBLE_BOT_MESSAGES> = {
    messages: T[];
};

/**
 * The messages with what their model calls spent (`usage`), for a live
 * push: a pushed bot message must carry it like a loaded one
 * (`grabBotMessages`), or the thread shows its tokens only after a reload.
 * Messages with no calls (the user's own among them) are left as they are.
 */
export default async function withMessageUsage<T extends BUN_SQLITE_COBBLE_BOT_MESSAGES>({
    messages,
}: Params<T>): Promise<(T & { usage?: TokenUsageSummary })[]> {
    const ids = messages.filter((m) => m.id && m.author == "bot").map((m) => Number(m.id));

    if (!ids.length) return messages;

    const usage = await grabMessageUsage({ message_ids: ids });

    return messages.map((message) => {
        const spent = usage.get(Number(message.id));

        return spent ? { ...message, usage: spent } : message;
    });
}
