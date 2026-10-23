import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserConversation from "@/src/functions/backend/db/bot-sessions/grab-user-conversation";
import countOpenBotJobs from "@/src/functions/backend/db/bots-queue/count-open-bot-jobs";
import stopBotJobs from "@/src/functions/backend/db/bots-queue/stop-bot-jobs";
import pushBotNotice from "@/src/bots-queue/push-bot-notice";
import { BotConversationRequestSchema } from "@/src/schemas/bot-schema";
import type { BotStoppedPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Pulls the plug on a bot for the session user: every job of it that's
 * queued or running in their conversations with it stops, its tasks close
 * and it goes idle, so a bot stuck waiting for a model (or anything else)
 * comes back at once. Stopping from a workspace stops the bot there and in
 * its own chat: the user asked for the bot to stop, not one tab of it.
 * A bot with nothing open is a no-op. The messages that end the wait go
 * out live, to this tab and the user's others.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotStoppedPayload>> = async ({
    req,
    body,
}) => {
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

        const { bot_id, workspace_id } = parseWithSchema({
            schema: BotConversationRequestSchema,
            data: body,
        });

        /**
         * Checked against the conversation it was asked from, so the stop
         * button works exactly where the conversation opens.
         */
        const conversation = await grabUserConversation({
            user_id: user.id,
            bot_id,
            workspace_id,
        });

        const stopped = await stopBotJobs({
            bot_id: conversation.bot.id,
            user_id: user.id,
        });

        if (stopped) {
            /**
             * Live only: the user just pressed the button in the app, so
             * their devices don't need a notification per conversation.
             */
            for (const message of stopped.messages) {
                await pushBotNotice({
                    bot_id: conversation.bot.id,
                    message,
                    quiet_push: true,
                });
            }

            await pushBotNotice({ bot_id: conversation.bot.id, bot: stopped.bot });
        }

        return {
            success: true,
            singleRes: {
                bot_id: conversation.bot.id,
                stopped: stopped?.jobs.length || 0,
                remaining:
                    (await countOpenBotJobs({
                        bot_id: conversation.bot.id,
                        user_id: user.id,
                    })) || 0,
            },
            msg: stopped
                ? `Stopped ${stopped.jobs.length} ${stopped.jobs.length == 1 ? "job" : "jobs"}.`
                : `Nothing is running.`,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
