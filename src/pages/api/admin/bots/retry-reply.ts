import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE } from "@/db/types/db";
import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserBotMessage from "@/src/functions/backend/db/bots/grab-user-bot-message";
import grabUserBotSession from "@/src/functions/backend/db/bot-sessions/grab-user-bot-session";
import grabUserConversation from "@/src/functions/backend/db/bot-sessions/grab-user-conversation";
import grabAnsweredMessageId from "@/src/functions/backend/db/bots-queue/grab-answered-message-id";
import enqueueBotReply from "@/src/functions/backend/db/bots-queue/enqueue-bot-reply";
import pushToSessionUser from "@/src/bots-queue/push-to-session-user";
import wakeBotsQueue from "@/src/bots-queue/wake-bots-queue";
import { RetryReplyRequestSchema } from "@/src/schemas/bot-schema";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import rerunReplyProblem from "@/src/utils/rerun-reply-problem";
import retryReplyProblem from "@/src/utils/retry-reply-problem";
import safeErrorMessage from "@/src/utils/safe-error-message";

/**
 * Runs the bot's last reply again, queues a failed reply after its failure
 * notice, or answers the user's own last message again when a stopped run
 * left it with nothing on its way. The bot, session and message to answer
 * are read from the message clicked, never the request. A failure notice's
 * `needs_you` is cleared (the bot is on it again), which takes the Retry
 * action off it, and the change is pushed to the user's other open tabs.
 * Eligibility is in `retryReplyProblem` (a failure notice of a reply) and
 * `rerunReplyProblem` (the bot's last word, or the user's own last message,
 * in an active conversation).
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }

        const { message_id } = parseWithSchema({
            schema: RetryReplyRequestSchema,
            data: body,
        });

        const message = await grabUserBotMessage({ user_id: user.id, message_id });

        const job = (
            await BunSQLite.sql<Pick<BUN_SQLITE_COBBLE_BOTS_QUEUE, "id" | "kind">>({
                sql: `SELECT id, kind FROM bots_queue WHERE id = ? LIMIT 1`,
                values: [message.failed_job_id || 0],
            })
        ).payload?.[0];

        const session = await grabUserBotSession({
            session_id: Number(message.session_id),
            user_id: user.id,
        });

        await grabUserConversation({
            user_id: user.id,
            bot_id: Number(message.bot_id),
            workspace_id: message.workspace_id,
        });

        const open = (
            await BunSQLite.sql<{ id: number }>({
                sql: `SELECT id FROM bots_queue
                    WHERE session_id = ? AND kind = 'reply' AND status IN ('pending', 'working')
                    LIMIT 1`,
                values: [Number(message.session_id)],
            })
        ).payload?.[0];

        const latest_user = (
            await BunSQLite.sql<{ id: number }>({
                sql: `SELECT id FROM bot_messages
                    WHERE session_id = ? AND author = 'user'
                    ORDER BY id DESC LIMIT 1`,
                values: [Number(message.session_id)],
            })
        ).payload?.[0];

        const answered_id = await grabAnsweredMessageId({ session_id: Number(message.session_id) });

        /**
         * The bot's own last word, which is what the action runs again. A
         * crew message and an install request's answer sit in the
         * conversation too, but they are not the bot's reply.
         */
        const last_bot = (
            await BunSQLite.sql<{ id: number }>({
                sql: `SELECT id FROM bot_messages
                    WHERE session_id = ? AND author = 'bot'
                        AND from_ask_id IS NULL AND from_install_request_id IS NULL
                    ORDER BY id DESC LIMIT 1`,
                values: [Number(message.session_id)],
            })
        ).payload?.[0];

        /**
         * The session's newest message, whatever it is: a user message is
         * only asked again while nothing followed it.
         */
        const last_message = (
            await BunSQLite.sql<{ id: number }>({
                sql: `SELECT id FROM bot_messages WHERE session_id = ? ORDER BY id DESC LIMIT 1`,
                values: [Number(message.session_id)],
            })
        ).payload?.[0];

        /**
         * A failed reply is retried as before (its notice's `needs_you` is
         * cleared); anything else the bot said last (an answer, a stopped
         * run's notice, a task's failure) is run again the same way: a
         * reply answering the newest user message afresh. The user's own
         * message is answered again too when a stopped or pruned run left it
         * last with nothing on its way.
         */
        const problem =
            job?.kind == "reply"
                ? retryReplyProblem({
                      message,
                      job_kind: job.kind,
                      session_status: session?.status,
                      open_reply_id: open?.id,
                      latest_user_id: latest_user?.id,
                      answered_id,
                  })
                : rerunReplyProblem({
                      message,
                      last_bot_id: last_bot?.id,
                      last_message_id: last_message?.id,
                      session_status: session?.status,
                      open_reply_id: open?.id,
                      latest_user_id: latest_user?.id,
                  });

        if (problem) {
            throw new AppError(problem);
        }

        await enqueueBotReply({
            user_id: user.id,
            bot_id: Number(message.bot_id),
            session_id: Number(message.session_id),
            message_id: Number(latest_user?.id),
            params: { retry_of: Number(message.id) },
        });

        wakeBotsQueue();

        /**
         * A failure notice the bot is on again no longer needs the user, and
         * the change goes out so the Retry action leaves it in every open
         * tab. A reply the user simply asked to run again has nothing to
         * clear.
         */
        if (message.needs_you) {
            await BunSQLite.sql({
                sql: `UPDATE bot_messages SET needs_you = 0, updated_at = ? WHERE id = ?`,
                values: [Date.now(), Number(message.id)],
            });

            await pushToSessionUser({
                session_id: message.session_id,
                data: {
                    event: "server:bot-message",
                    data: { ...message, needs_you: 0 },
                },
            });
        }

        return {
            success: true,
            singleRes: { message_id: Number(message.id) },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
