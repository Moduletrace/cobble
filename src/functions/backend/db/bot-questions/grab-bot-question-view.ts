import BunSQLite from "@moduletrace/bun-sqlite";
import type { BotQuestionStatus } from "@/src/dict/bot-question-dict";
import type { BotQuestionView } from "@/src/types";
import parseBotQuestionRow from "@/src/utils/parse-bot-question-row";
import grabBotQuestion from "./grab-bot-question";

type Params = {
    question_id: number | string;
    user_id: number | string;
};

/**
 * Questions a bot asked the user as their chip and card show them: the
 * questions, their options and, once answered, what the user picked.
 */
export default async function grabBotQuestionView({ question_id, user_id }: Params): Promise<BotQuestionView> {
    const row = await grabBotQuestion({ question_id, user_id });
    const { questions, answers } = parseBotQuestionRow({ row });

    const bot = (
        await BunSQLite.sql<{ name: string }>({
            sql: `SELECT name FROM bots WHERE id = ? LIMIT 1`,
            values: [row.bot_id || 0],
        })
    ).payload?.[0];

    return {
        id: Number(row.id),
        title: row.title || "",
        questions,
        answers,
        status: (row.status || "pending") as BotQuestionStatus,
        bot_id: Number(row.bot_id),
        bot_name: bot?.name || "The bot",
    };
}
