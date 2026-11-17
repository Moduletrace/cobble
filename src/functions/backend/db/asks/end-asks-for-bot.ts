import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";
import cancelAskJobs from "./cancel-ask-jobs";
import finishAsk from "./finish-ask";

type Params = {
    bot_id: number | string;
};

/**
 * Ends every request a bot is part of, before the bot row goes: the ones it
 * asked and the ones it was asked. Left open, an ask stays `working` for
 * good (nothing would ever end it), it is never pruned, and it spends the
 * asking bot's open-request allowance (`AppData.AskMaxOpenPerBot`) so that
 * bot can never ask anyone again. A request whose asked bot is gone ends
 * with a failure the asking bot is woken with; one whose asking bot is gone
 * is only closed, since there is nobody to tell.
 */
export default async function endAsksForBot({ bot_id }: Params) {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_ASKS>({
        sql: `SELECT * FROM bot_asks
            WHERE status IN ('pending', 'working')
                AND (requester_bot_id = ? OR target_bot_id = ?)`,
        values: [Number(bot_id), Number(bot_id)],
    });

    const ended: BUN_SQLITE_COBBLE_BOT_ASKS[] = [];

    for (const ask of res.payload || []) {
        const asked = Number(ask.target_bot_id) == Number(bot_id);

        const finished = await finishAsk({
            ask,
            status: "failed",
            outcome: asked
                ? "The bot it was passed to was deleted, so it never answered."
                : "The bot that asked was deleted.",
            wake: asked && Number(ask.requester_bot_id) != Number(bot_id),
        });

        if (!finished) continue;

        ended.push(finished);

        /**
         * Whatever was still running for it goes too, and its task closes
         * with it (`cancelAskJobs`).
         */
        await cancelAskJobs({ ask_id: Number(ask.id), reason: "The bot was deleted." });
    }

    return ended;
}