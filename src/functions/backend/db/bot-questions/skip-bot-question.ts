import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabBotQuestion from "./grab-bot-question";

type Params = {
    question_id: number | string;
    user_id: number | string;
};

/**
 * The user skipped questions a bot asked: nothing is answered.
 */
export default async function skipBotQuestion({ question_id, user_id }: Params) {
    const row = await grabBotQuestion({ question_id, user_id });
    const now = Date.now();

    const claimed = await BunSQLite.sql<{ id: number }>({
        sql: `UPDATE bot_questions SET status = 'skipped', decided_at = ?, updated_at = ?
            WHERE id = ? AND status = 'pending' RETURNING id`,
        values: [now, now, Number(row.id)],
    });

    if (!claimed.payload?.[0]) throw new AppError(`These questions were already ${row.status}.`);

    return row;
}
