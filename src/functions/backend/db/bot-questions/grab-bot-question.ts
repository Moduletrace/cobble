import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_QUESTIONS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";

type Params = {
    question_id: number | string;
    /**
     * Only the user they were asked of reads them.
     */
    user_id: number | string;
};

/**
 * Questions a bot asked, only for the user they were asked of. Throws
 * otherwise.
 */
export default async function grabBotQuestion({ question_id, user_id }: Params) {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_QUESTIONS>({
            sql: `SELECT * FROM bot_questions WHERE id = ? AND user_id = ? LIMIT 1`,
            values: [Number(question_id), Number(user_id)],
        })
    ).payload?.[0];

    if (!row?.id) throw new AppError(`Those questions aren't yours or no longer exist.`);

    return row;
}
