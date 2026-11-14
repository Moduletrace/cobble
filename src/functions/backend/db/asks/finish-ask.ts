import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";
import type { AskStatus } from "@/src/dict/ask-dict";
import AppError from "@/src/utils/app-error";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import enqueueBotReply from "../bots-queue/enqueue-bot-reply";
import ensureBotSession from "../bot-sessions/ensure-bot-session";
import grabUserBot from "../bots/grab-user-bot";
import grabUserBotSession from "../bot-sessions/grab-user-bot-session";
import insertUserMessage from "../bots/insert-user-message";
import askOutcomeMessage from "./ask-outcome-message";

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

    await tellRequester({ ask: finished, status, outcome, wake });

    return finished;
}

/**
 * Posts the outcome into the asking bot's conversation. The origin session
 * when it is still the active one (the user is still there); otherwise the
 * bot's current conversation, so the outcome isn't lost in a closed thread.
 */
async function tellRequester({
    ask,
    status,
    outcome,
    wake,
}: {
    ask: BUN_SQLITE_COBBLE_BOT_ASKS;
    status: AskStatus;
    outcome?: string | null;
    wake: boolean;
}) {
    const requester = await grabUserBot({ bot_id: Number(ask.requester_bot_id)!, user_id: Number(ask.user_id)! });

    if (!requester?.id) return;

    const origin = await grabUserBotSession({ session_id: ask.origin_session_id!, user_id: Number(ask.user_id)! });

    const session =
        origin?.status == "active"
            ? origin
            : await ensureBotSession({
                  user_id: Number(ask.user_id)!,
                  bot_id: requester.id,
                  workspace_id: Number(ask.workspace_id) || null,
              });

    if (!session?.id) {
        throw new AppError(`Couldn't find the conversation this request came from.`);
    }

    const message = await insertUserMessage({
        bot_id: requester.id,
        session_id: session.id,
        workspace_id: Number(ask.workspace_id) || null,
        text: askOutcomeMessage({ ask, status, outcome }),
        from_ask_id: Number(ask.id),
    });

    await pushBotNotice({ bot_id: requester.id, message });

    if (wake) {
        await enqueueBotReply({
            user_id: Number(ask.user_id)!,
            bot_id: requester.id,
            session_id: session.id,
            message_id: message.id!,
        });
    }
}
