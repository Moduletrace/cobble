import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import checkBotQuestionAnswers from "@/src/utils/check-bot-question-answers";
import parseBotQuestionRow from "@/src/utils/parse-bot-question-row";
import grabBotQuestion from "./grab-bot-question";

type Params = {
    question_id: number | string;
    user_id: number | string;
    answers: { choices: number[]; other?: string }[];
};

/**
 * The user answered questions a bot asked in its card: checked against the
 * questions (`checkBotQuestionAnswers`), then stored once (only pending
 * questions move, so a double click answers once).
 */
export default async function answerBotQuestion({ question_id, user_id, answers }: Params) {
    const row = await grabBotQuestion({ question_id, user_id });
    const { questions } = parseBotQuestionRow({ row });
    const checked = checkBotQuestionAnswers({ questions, answers });
    const now = Date.now();

    const claimed = await BunSQLite.sql<{ id: number }>({
        sql: `UPDATE bot_questions SET status = 'answered', answers = ?, decided_at = ?, updated_at = ?
            WHERE id = ? AND status = 'pending' RETURNING id`,
        values: [JSON.stringify(checked), now, now, Number(row.id)],
    });

    if (!claimed.payload?.[0]) throw new AppError(`These questions were already ${row.status}.`);

    return row;
}
