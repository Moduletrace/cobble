import BunSQLite from "@moduletrace/bun-sqlite";
import followedSessionSql from "../bot-sessions/followed-session-sql";

type Params = {
    bot_id: number | string;
    /**
     * Only jobs in this user's conversations.
     */
    user_id: number | string;
};

/**
 * Whether a run of the bot's is queued behind another on the same computer.
 * `claimBotJobs` takes one task run per computer at a time, so a second one
 * waits for the first to end, however long that takes: with no job
 * processing, the bot's face said "waiting for a free model" when what it
 * waits on is the computer. Only jobs the user follows count, since a crew
 * request's or a silent hook's run never shows on the face.
 */
export default async function botWaitsOnComputer({ bot_id, user_id }: Params): Promise<boolean> {
    const res = await BunSQLite.sql<{ waiting: number }>(botWaitsOnComputerSql({ bot_id, user_id }));

    return Boolean(res.payload?.[0]?.waiting);
}

/**
 * The statement itself, checked against real SQLite
 * (`bot-waits-on-computer.test.ts`).
 */
export function botWaitsOnComputerSql({ bot_id, user_id }: Params) {
    return {
        sql: `SELECT 1 AS waiting FROM bots_queue AS queued
            WHERE queued.bot_id = ? AND queued.status = 'pending'
            AND queued.session_id IN (SELECT id FROM bot_sessions WHERE user_id = ? AND ${followedSessionSql()})
            AND EXISTS (
                SELECT 1 FROM bots_queue AS running
                WHERE running.status = 'processing' AND running.kind = 'task'
                AND running.computer_id = queued.computer_id
            )
            LIMIT 1`,
        values: [bot_id, user_id],
    };
}