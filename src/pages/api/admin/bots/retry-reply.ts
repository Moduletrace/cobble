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
import retryReplyProblem from "@/src/utils/retry-reply-problem";
import safeErrorMessage from "@/src/utils/safe-error-message";

/**
 * Queues the bot's reply again after one failed, from its failure notice
 * (`failed_job_id`, a reply job only). The bot, session and message to
 * answer are read from the notice, never the request. The notice's
 * `needs_you` is cleared (the bot is on it again), which takes the Retry
 * action off it, and the change is pushed to the user's other open tabs.
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

        const problem = retryReplyProblem({
            message,
            job_kind: job?.kind,
            session_status: session?.status,
            open_reply_id: open?.id,
            latest_user_id: latest_user?.id,
            answered_id,
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

        await BunSQLite.sql({
            sql: `UPDATE bot_messages SET needs_you = 0, updated_at = ? WHERE id = ?`,
            values: [Date.now(), Number(message.id)],
        });

        wakeBotsQueue();

        await pushToSessionUser({
            session_id: message.session_id,
            data: {
                event: "server:bot-message",
                data: { ...message, needs_you: 0 },
            },
        });

        return {
            success: true,
            singleRes: { message_id: Number(message.id) },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
