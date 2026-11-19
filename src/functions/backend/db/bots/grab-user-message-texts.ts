import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";

type Params = {
    session_id: number | string;
};

/**
 * Human messages in a session, oldest first: what a crew-changing tool's
 * quote is looked for in (`userAskedQuote`). Crew briefs and install
 * answers are stored on the user side, so they are left out.
 */
export default async function grabUserMessageTexts({ session_id }: Params): Promise<string[]> {
    const res = await BunSQLite.sql<Pick<BUN_SQLITE_COBBLE_BOT_MESSAGES, "text">>({
        sql: `SELECT text FROM bot_messages
            WHERE session_id = ? AND author = 'user'
                AND from_ask_id IS NULL AND from_install_request_id IS NULL
            ORDER BY id ASC`,
        values: [session_id],
    });

    return (res.payload || []).map((row) => row.text || "").filter(Boolean);
}
