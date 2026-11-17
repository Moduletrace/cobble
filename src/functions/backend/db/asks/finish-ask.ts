import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";
import type { AskStatus } from "@/src/dict/ask-dict";
import askOutcomeMessage from "./ask-outcome-message";
import tellAskRequester from "./tell-ask-requester";
import stripQuestionRefs from "@/src/utils/strip-question-refs";

type Params = {
    ask: BUN_SQLITE_COBBLE_BOT_ASKS;
    status: AskStatus;
    outcome?: string | null;
    /**
     * The coordinator's reason, kept on the row for the record.
     */
    gate_note?: string | null;
    /**
     * Wake the bot that asked with the outcome (a stopped run isn't woken).
     */
    wake?: boolean;
};

/**
 * Ends one request: its final status and outcome are written once, and the
 * bot that asked gets the outcome as a user-side crew message in the
 * conversation it asked from, which wakes it with a reply unless the user
 * stopped it. Null when the ask already ended.
 */
export default async function finishAsk({
    ask,
    status,
    outcome,
    gate_note,
    wake = true,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_ASKS | null> {
    const now = Date.now();

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_ASKS>({
        sql: `UPDATE bot_asks SET status = ?, outcome = ?, gate_note = COALESCE(?, gate_note), updated_at = ?
            WHERE id = ? AND status IN ('pending', 'working') RETURNING *`,
        values: [status, outcome || "", gate_note ? gate_note : null, now, Number(ask.id)],
    });

    const finished = res.payload?.[0];

    if (!finished?.id) return null;

    /**
     * A question the answer names stays in the conversation it was asked
     * in: its card here would answer into this one.
     */
    const text = askOutcomeMessage({
        ask: finished,
        status,
        outcome: outcome ? stripQuestionRefs({ text: outcome }).text : outcome,
    });

    await tellAskRequester({ ask: finished, text, wake });

    return finished;
}

