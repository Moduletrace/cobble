import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotMessageReply } from "@/src/types";

type Params = {
    message_ids: number[];
};

type ReplyRow = BotMessageReply & { message_id: number };

/**
 * The messages quoted by these messages, by the replying message's id, so
 * a reply can show what it answers without loading the whole history.
 */
export default async function grabMessagesReplies({ message_ids }: Params) {
    const by_message = new Map<number, BotMessageReply>();
    const ids = [...new Set(message_ids.filter(Boolean))];

    if (!ids.length) return by_message;

    const rows =
        (
            await BunSQLite.sql<ReplyRow>({
                sql: `SELECT r.id, r.author, r.text, m.id AS message_id FROM bot_messages m
                    JOIN bot_messages r ON r.id = m.reply_to_message_id
                    WHERE m.id IN (${ids.map(() => "?").join(", ")})`,
                values: ids,
            })
        ).payload || [];

    for (const { message_id, ...reply } of rows) {
        by_message.set(Number(message_id), reply);
    }

    return by_message;
}
