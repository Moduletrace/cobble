import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";
import { BotJobStoppedError } from "@/src/dict/bot-queue-dict";
import cancelAskJobs from "./cancel-ask-jobs";
import finishAsk from "./finish-ask";

type Params = {
    user_id: number | string;
    requester_bot_id: number | string;
    /**
     * The runs being stopped: the asks made from them are stopped with them.
     * Matched by the ask's own `requester_job_id`, so a request made by an
     * earlier run of the same conversation is not taken away when the user
     * stops an unrelated later one.
     */
    job_ids: (number | string)[];
    /**
     * Fallback for asks made before `requester_job_id` was recorded: the
     * sessions being stopped still stop the open asks that came from them.
     */
    session_ids: (number | string)[];
};

/**
 * Stops every request a bot made from a run the user just stopped: the ask
 * ends as `stopped` (the asking bot is told, but not woken, since its run is
 * the one that was stopped) and whatever run was working it is cancelled.
 */
export default async function stopAsks({ user_id, requester_bot_id, job_ids, session_ids }: Params) {
    if (!job_ids.length && !session_ids.length) return [];

    const job_placeholders = job_ids.length ? job_ids.map(() => "?").join(", ") : "";
    const session_placeholders = session_ids.length ? session_ids.map(() => "?").join(", ") : "";

    const match = [
        job_ids.length ? `(requester_job_id IN (${job_placeholders}))` : "",
        session_ids.length ? `(requester_job_id IS NULL AND origin_session_id IN (${session_placeholders}))` : "",
    ]
        .filter(Boolean)
        .join(" OR ");

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_ASKS>({
        sql: `SELECT * FROM bot_asks WHERE user_id = ? AND requester_bot_id = ?
            AND (${match}) AND status IN ('pending', 'working')`,
        values: [
            Number(user_id),
            Number(requester_bot_id),
            ...job_ids.map(Number),
            ...session_ids.map(Number),
        ],
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
