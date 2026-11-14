import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_ASKS, BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";
import { AskAnswerJobTitle, AskStages } from "@/src/dict/ask-dict";
import enqueueBotJob from "../bots-queue/enqueue-bot-job";
import insertUserMessage from "../bots/insert-user-message";
import askRequestMessage from "./ask-request-message";
import startBotSession from "../bot-sessions/start-bot-session";
import grabWorkspaceName from "../workspaces/grab-workspace-name";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import grabActiveBotSession from "../bot-sessions/grab-active-bot-session";

type Params = {
    ask: BUN_SQLITE_COBBLE_BOT_ASKS;
    target: BUN_SQLITE_COBBLE_BOTS;
    /**
     * Who asked, named in what the target opens with.
     */
    requester_name: string;
    /**
     * The coordinator's reason, kept with the row.
     */
    gate_note?: string | null;
};

/**
 * Sends an approved request to the bot that answers it: one reply job in a
 * session of its own, in the user's conversation with that bot **for the
 * workspace the request came from**, so the run keeps its workspace context
 * (instructions, memory, files, computers) and the answer is posted where
 * the work belongs. Every request starts a new session
 * (`startBotSession`), so the conversation the user was in is left where it
 * was. Opened with the brief as a user-side crew message. The ask is
 * `working` from here until that run ends (`onAskJobEnded`).
 */
export default async function enqueueAskAnswer({ ask, target, requester_name, gate_note }: Params) {
    const workspace_id = Number(ask.workspace_id) || null;
    const place = await grabWorkspaceName({ workspace_id });
    const previous = await grabActiveBotSession({
        user_id: Number(ask.user_id),
        bot_id: Number(target.id),
        workspace_id,
    });
    const session = await startBotSession({
        user_id: Number(ask.user_id),
        bot_id: Number(target.id),
        workspace_id,
    });

    /**
     * Titled from the request, so the sessions list says what it is before
     * the bot answers (`nameBotSession` renames it from the exchange).
     */
    if (ask.title) {
        await BunSQLite.sql({
            sql: "UPDATE bot_sessions SET title = ? WHERE id = ? AND title IS NULL",
            values: [String(ask.title).slice(0, 120), session.id!],
        }).catch(() => null);
    }

    const message = await insertUserMessage({
        bot_id: Number(target.id),
        session_id: Number(session.id),
        workspace_id,
        text: askRequestMessage({ ask, requester_name, place }),
        from_ask_id: Number(ask.id),
    });

    /**
     * The conversation the request opened is where the work shows up: a page
     * already open on it gets the brief without a reload.
     */
    await pushBotNotice({ bot_id: Number(target.id), message });

    let job_id: number;

    try {
        job_id = Number(
            await enqueueBotJob({
                kind: "reply",
                user_id: Number(ask.user_id),
                bot_id: Number(target.id),
                session_id: Number(session.id),
                title: AskAnswerJobTitle,
                instructions: ask.request || "",
                message_id: message.id!,
                params: { ask_id: ask.id, stage: AskStages.answer },
            }),
        );
    } catch (error) {
        /**
         * Nothing would ever answer it: end it rather than leave the asker
         * waiting on a request the user has no way to see.
         */
        const { default: finishAsk } = await import("./finish-ask");

        await finishAsk({
            ask,
            status: "failed",
            outcome: "It couldn't be passed to that bot. Try again, or ask another bot.",
        }).catch(() => null);

        throw error;
    }

    /**
     * The ask may have been stopped while the gate read it: the run is
     * cancelled and the ask stays as the user left it.
     */
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_ASKS>({
        sql: `UPDATE bot_asks SET status = 'working', target_bot_id = ?, session_id = ?, job_id = ?,
                previous_session_id = COALESCE(previous_session_id, ?), gate_note = COALESCE(?, gate_note), updated_at = ?
            WHERE id = ? AND status = 'pending' RETURNING id`,
        values: [
            Number(target.id),
            Number(session.id),
            job_id,
            previous ? Number(previous.id) : null,
            gate_note || null,
            Date.now(),
            Number(ask.id),
        ],
    });

    if (!res.payload?.[0]?.id) {
        const { default: cancelBotJob } = await import("../bots-queue/cancel-bot-job");

        await cancelBotJob({ user_id: Number(ask.user_id), job_id }).catch(() => null);

        return null;
    }

    return job_id;
}
