import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    session_id: number | string;
    limit: number;
};

export type SessionOpeningMessage = Pick<
    BUN_SQLITE_COBBLE_BOT_MESSAGES,
    "id" | "author" | "text" | "carried_from_session_id"
>;

/**
 * A session's first messages, oldest first: what it was started for,
 * however long it has gone on since. (`grabBotMessages` reads the latest.)
 */
export default async function grabSessionOpening({ session_id, limit }: Params): Promise<SessionOpeningMessage[]> {
    return (
        (
            await BunSQLite.sql<SessionOpeningMessage>({
                sql: `SELECT id, author, text, carried_from_session_id FROM bot_messages
                    WHERE session_id = ? ORDER BY created_at ASC, id ASC LIMIT ?`,
                values: [session_id, limit],
            })
        ).payload || []
    );
}
