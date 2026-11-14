import type { BUN_SQLITE_COBBLE_BOT_ASKS, BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import type { AskDecision } from "@/src/dict/ask-dict";
import enqueueAskAnswer from "./enqueue-ask-answer";
import finishAsk from "./finish-ask";

type Params = {
    ask: BUN_SQLITE_COBBLE_BOT_ASKS;
    decision: AskDecision;
    reason: string;
    /**
     * The bot that should answer it: the one asked, or the one the
     * coordinator redirected it to. Left out for a refusal.
     */
    target?: BUN_SQLITE_COBBLE_BOTS | null;
    requester_name: string;
};

/**
 * Does what the coordinator decided: a refusal ends the ask with its reason;
 * an approval or a redirect sends it to the bot that should answer, and the
 * asker hears back when that run ends.
 */
export default async function applyAskDecision({
    ask,
    decision,
    reason,
    target,
    requester_name,
}: Params) {
    if (decision == "refuse" || !target?.id) {
        return await finishAsk({
            ask,
            status: "refused",
            outcome: reason,
            gate_note: reason,
        });
    }

    await enqueueAskAnswer({ ask, target, requester_name, gate_note: reason });

    return null;
}
