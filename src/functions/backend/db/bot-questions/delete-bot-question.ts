import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    question_id: number | string;
};

/**
 * Deletes questions a bot asked whose message never went out. The card is
 * the only way to answer them, so a row left behind waits for an answer
 * nobody can give, and counts as still asked.
 */
export default async function deleteBotQuestion({ question_id }: Params) {
    const res = await BunSQLite.sql({
        sql: "DELETE FROM bot_questions WHERE id = ? AND status = 'pending'",
        values: [question_id],
    });

    if (res.error) throw new Error(`Couldn't delete the question: ${res.msg || res.error}`);

    return true;
}