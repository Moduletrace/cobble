import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_QUESTIONS, BunSQLiteTables } from "@/db/types/db";
import type { BotQuestionItem } from "@/src/types";

type Params = {
    user_id: number | string;
    bot_id: number | string;
    session_id: number | string;
    workspace_id?: number | string | null;
    title: string;
    questions: BotQuestionItem[];
};

/**
 * Stores questions a bot asks the user, pending until they answer or skip
 * them in its card. Returns its id.
 */
export default async function createBotQuestion({ user_id, bot_id, session_id, workspace_id, title, questions }: Params) {
    const res = await BunSQLite.insert<BUN_SQLITE_COBBLE_BOT_QUESTIONS, (typeof BunSQLiteTables)[number]>({
        table: "bot_questions",
        data: [
            {
                title,
                questions: JSON.stringify(questions),
                status: "pending",
                user_id: Number(user_id),
                bot_id: Number(bot_id),
                session_id: Number(session_id),
                workspace_id: workspace_id ? Number(workspace_id) : undefined,
            },
        ],
    });

    const id = Number(res.singleRes?.id || res.postInsertReturn?.insertId);

    if (!res.success || !id) throw new Error(`Couldn't store the questions: ${res.msg}`);

    return id;
}
