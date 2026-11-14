import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";
import { BotJobStoppedError } from "@/src/dict/bot-queue-dict";
import cancelAskJobs from "./cancel-ask-jobs";
import finishAsk from "./finish-ask";

type Params = {
    user_id: number | string;
    requester_bot_id: number | string;
    /**
     * The sessions being stopped: the asks they made are stopped with them.
     */
    session_ids: (number | string)[];
};

/**
 * Stops every request a bot made from a run the user just stopped: the ask
 * ends as `stopped` (the asking bot is told, but not woken, since its run is
 * the one that was stopped) and whatever run was working it is cancelled.
 */
export default async function stopAsks({ user_id, requester_bot_id, session_ids }: Params) {
    if (!session_ids.length) return [];

    const placeholders = session_ids.map(() => "?").join(", ");

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_ASKS>({
        sql: `SELECT * FROM bot_asks WHERE user_id = ? AND requester_bot_id = ?
            AND origin_session_id IN (${placeholders}) AND status IN ('pending', 'working')`,
        values: [Number(user_id), Number(requester_bot_id), ...session_ids.map(Number)],
    });

    const stopped: BUN_SQLITE_COBBLE_BOT_ASKS[] = [];

    for (const ask of res.payload || []) {
        const finished = await finishAsk({
            ask,
            status: "stopped",
            outcome: "The user stopped the run that asked, so there is no answer.",
            wake: false,
        });

        if (!finished) continue;

        stopped.push(finished);

        await cancelAskJobs({ ask_id: ask.id!, reason: BotJobStoppedError });
    }

    return stopped;
}
