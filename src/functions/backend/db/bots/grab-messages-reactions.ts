import BunSQLite from "@moduletrace/bun-sqlite";
import {
    BotMessageReactions,
    type BotMessageReactionEmoji,
} from "@/src/dict/bot-dict";
import type { BotMessageReaction } from "@/src/types";

type Params = {
    message_ids: number[];
    user_id: number | string;
};

type ReactionRow = {
    message_id: number;
    emoji: BotMessageReactionEmoji;
    user_id: number;
};

/**
 * A message's reactions, grouped by emoji, in the picker's order, with
 * whether the given user reacted and how many did.
 */
export default async function grabMessagesReactions({ message_ids, user_id }: Params) {
    const by_message = new Map<number, BotMessageReaction[]>();
    const ids = [...new Set(message_ids.filter(Boolean))];

    if (!ids.length) return by_message;

    const rows =
        (
            await BunSQLite.sql<ReactionRow>({
                sql: `SELECT message_id, emoji, user_id FROM bot_message_reactions
                    WHERE message_id IN (${ids.map(() => "?").join(", ")})
                    ORDER BY id ASC`,
                values: ids,
            })
        ).payload || [];

    const order = new Map<string, number>(
        BotMessageReactions.map((reaction, index) => [reaction.value, index]),
    );

    for (const row of rows) {
        const list = by_message.get(row.message_id) || [];
        const found = list.find((reaction) => reaction.emoji == row.emoji);

        if (found) {
            found.count += 1;
            found.mine = found.mine || String(row.user_id) == String(user_id);
        } else {
            list.push({
                emoji: row.emoji,
                count: 1,
                mine: String(row.user_id) == String(user_id),
            });
        }

        by_message.set(row.message_id, list);
    }

    for (const list of by_message.values()) {
        list.sort(
            (a, b) =>
                (order.get(a.emoji) ?? BotMessageReactions.length) -
                (order.get(b.emoji) ?? BotMessageReactions.length),
        );
    }

    return by_message;
}
