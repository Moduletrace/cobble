import BunSQLite from "@moduletrace/bun-sqlite";

type Params = {
    session_ids: number[];
};

/**
 * Deletes the plans of sessions that are going away, with the conversation
 * they belonged to (foreign keys are off outside the server process, so a
 * parent's children go explicitly).
 */
export default async function deleteBotPlanRows({ session_ids }: Params) {
    const ids = session_ids.map(Number).filter(Boolean);

    if (!ids.length) return;

    await BunSQLite.sql({
        sql: `DELETE FROM bot_plans WHERE session_id IN (${ids.map(() => "?").join(", ")})`,
        values: ids,
    });
}