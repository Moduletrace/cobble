import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_SUGGESTIONS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";

type Params = {
    suggestion_id: number | string;
    /**
     * Only the user they were suggested to reads them.
     */
    user_id: number | string;
};

/**
 * Next steps a bot suggested, only for the user they were suggested to.
 * Throws otherwise.
 */
export default async function grabBotSuggestion({ suggestion_id, user_id }: Params) {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SUGGESTIONS>({
            sql: `SELECT * FROM bot_suggestions WHERE id = ? AND user_id = ? LIMIT 1`,
            values: [Number(suggestion_id), Number(user_id)],
        })
    ).payload?.[0];

    if (!row?.id) throw new AppError(`Those next steps aren't yours or no longer exist.`);

    return row;
}