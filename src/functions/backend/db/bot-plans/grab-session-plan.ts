import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_PLANS } from "@/db/types/db";
import { BotPlanOpenStates } from "@/src/dict/bot-plan-dict";

type Params = {
    session_id: number | string;
};

/**
 * The plan open in a conversation: the one the bot is waiting on the user
 * to approve, or is working. A conversation has at most one, so a run
 * always knows which plan it is on. Null when the conversation has none
 * (finished and cancelled plans are history, not work).
 */
export default async function grabSessionPlan({ session_id }: Params) {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_PLANS>({
            sql: `SELECT * FROM bot_plans
                WHERE session_id = ? AND status IN (${BotPlanOpenStates.map(() => "?").join(", ")})
                ORDER BY id DESC LIMIT 1`,
            values: [Number(session_id), ...BotPlanOpenStates],
        })
    ).payload?.[0];

    return row?.id ? row : null;
}