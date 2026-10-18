import type {
    BUN_SQLITE_COBBLE_BOT_MESSAGES,
    BunSQLiteTables,
} from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    bot_id: number;
    text: string;
};

/**
 * Appends a user message to a bot's conversation and bumps its activity.
 * Callers must check the bot belongs to the session user first.
 */
export default async function insertUserMessage({
    bot_id,
    text,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_MESSAGES> {
    const now = Date.now();

    const res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_BOT_MESSAGES,
        (typeof BunSQLiteTables)[number]
    >({
        table: "bot_messages",
        data: [{ bot_id, author: "user", text, needs_you: 0 }],
    });

    const id = res.postInsertReturn?.insertId;

    if (!res.success || !id) {
        throw new Error(`Failed to save message: ${res.msg}`);
    }

    await BunSQLite.sql({
        sql: `UPDATE bots SET last_activity_at = ? WHERE id = ?`,
        values: [now, bot_id],
    });

    return {
        id,
        bot_id,
        author: "user",
        text,
        needs_you: 0,
        created_at: now,
        updated_at: now,
    };
}
