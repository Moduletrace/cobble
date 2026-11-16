import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_PLANS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";

type Params = {
    plan_id: number | string;
    /**
     * Only the user a plan was made for reads it. Left out by a run, which
     * already works that user's conversation.
     */
    user_id?: number | string | null;
};

/**
 * A plan as the helpers read it: its id and the places it belongs to are
 * there once it's been found, which the typedef can't say on its own.
 */
export type BotPlanRow = BUN_SQLITE_COBBLE_BOT_PLANS & {
    id: number;
    user_id: number;
    bot_id: number;
    session_id: number;
    title: string;
};

/**
 * A plan by its id, with the name of the bot that wrote it (a run's prompt
 * and the card both name it). Throws when it isn't there, or isn't the
 * user's.
 */
export default async function grabBotPlan({ plan_id, user_id }: Params) {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_PLANS & { bot_name?: string }>({
            sql: `SELECT bp.*, b.name AS bot_name FROM bot_plans bp
                LEFT JOIN bots b ON b.id = bp.bot_id
                WHERE bp.id = ?${user_id ? " AND bp.user_id = ?" : ""} LIMIT 1`,
            values: user_id ? [Number(plan_id), Number(user_id)] : [Number(plan_id)],
        })
    ).payload?.[0];

    if (!row?.id) throw new AppError(`That plan isn't yours or no longer exists.`);

    return row as BotPlanRow;
}