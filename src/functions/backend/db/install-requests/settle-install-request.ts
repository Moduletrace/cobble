import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_SESSIONS, BUN_SQLITE_COBBLE_BOTS_QUEUE, BUN_SQLITE_COBBLE_INSTALL_REQUESTS } from "@/db/types/db";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import { AppData } from "@/src/data/app-data";
import type { InstallRequestStatus } from "@/src/dict/install-request-dict";
import { logError } from "@/src/functions/backend/logger";
import installOutcomeMessage from "@/src/utils/install-outcome-message";
import installRequestAsked from "@/src/utils/install-request-asked";
import parseInstallPackages from "@/src/utils/parse-install-packages";
import ensureBotSession from "../bot-sessions/ensure-bot-session";
import insertUserMessage from "../bots/insert-user-message";
import enqueueBotReply from "../bots-queue/enqueue-bot-reply";
import stripQuestionRefs from "@/src/utils/strip-question-refs";

type Params = {
    job: Pick<BUN_SQLITE_COBBLE_BOTS_QUEUE, "id">;
    /**
     * What the job ended with: its report, or why it failed.
     */
    text?: string | null;
    failed?: boolean;
};

/**
 * When the coordinator's run on an install request ends (done, failed,
 * lost, stopped, cancelled), the worker that asked hears how it went: a
 * message in its conversation (the session it asked from while that's
 * active, else its active one there), on the user's side and shown as from
 * the coordinator, which wakes it to carry on (stopped included: the
 * worker isn't the bot that was stopped, and tells its user). A request the run never
 * answered is failed, with what the run said. Not an install request's
 * job: nothing. Never throws.
 */
export default async function settleInstallRequest({ job, text, failed }: Params) {
    try {
        if (!job.id) return;

        const now = Date.now();
        const unanswered = failed
            ? `The coordinator's run on it failed: ${text || "no reason given"}`
            : `The coordinator ended its run without answering it.${text?.trim() ? ` What it said: ${text.trim()}` : ""}`;

        await BunSQLite.sql({
            sql: `UPDATE install_requests SET status = 'failed', answer = ?, decided_at = ?, updated_at = ?
                WHERE job_id = ? AND status = 'pending'`,
            values: [unanswered.slice(0, AppData.InstallRequestAnswerMaxChars), now, now, Number(job.id)],
        });

        const request = (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_INSTALL_REQUESTS>({
                sql: `SELECT * FROM install_requests WHERE job_id = ? LIMIT 1`,
                values: [Number(job.id)],
            })
        ).payload?.[0];

        if (!request?.id || !request.user_id || !request.bot_id) return;

        const session = await pickWorkerSession({ request });
        const message = await insertUserMessage({
            bot_id: request.bot_id,
            session_id: Number(session.id),
            workspace_id: session.workspace_id || null,
            text: installOutcomeMessage({
                request_id: request.id,
                status: (request.status || "failed") as InstallRequestStatus,
                asked: installRequestAsked({ packages: parseInstallPackages({ text: request.packages }) }),
                /**
                 * A question the coordinator asked stays in its own
                 * conversation: a card here would answer into this one.
                 */
                answer: request.answer ? stripQuestionRefs({ text: request.answer }).text : request.answer,
            }),
            from_install_request_id: request.id,
        });

        await BunSQLite.sql({ sql: `UPDATE bot_sessions SET unread = 1 WHERE id = ?`, values: [session.id!] });
        await pushBotNotice({ bot_id: request.bot_id, message });

        await enqueueBotReply({
            user_id: request.user_id,
            bot_id: request.bot_id,
            session_id: Number(session.id),
            message_id: Number(message.id),
        });
    } catch (error) {
        await logError({
            title: `An install request's answer didn't reach the bot that asked`,
            error,
            metadata: { job_id: job.id },
        }).catch(() => {});
    }
}

/**
 * The session the worker asked from while it's still where it talks,
 * else its conversation's active one there.
 */
async function pickWorkerSession({ request }: { request: BUN_SQLITE_COBBLE_INSTALL_REQUESTS }) {
    const origin = request.session_id
        ? (
              await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_SESSIONS>({
                  sql: `SELECT * FROM bot_sessions WHERE id = ? AND bot_id = ? AND user_id = ? LIMIT 1`,
                  values: [request.session_id, request.bot_id!, request.user_id!],
              })
          ).payload?.[0]
        : null;

    if (origin?.id && origin.status == "active") return origin;

    return await ensureBotSession({
        user_id: request.user_id!,
        bot_id: request.bot_id!,
        workspace_id: request.workspace_id || null,
    });
}
