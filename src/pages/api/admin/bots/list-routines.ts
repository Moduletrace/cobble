import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserConversation from "@/src/functions/backend/db/bot-sessions/grab-user-conversation";
import grabCronJobs from "@/src/functions/backend/db/cron-jobs/grab-cron-jobs";
import type { CronJobWithNames } from "@/src/types";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * One conversation's routines: the schedules that run there, a bot's own
 * ones in its chat (`?workspace_id=` left out) or the ones that run in that
 * workspace. Only a user who chats there sees them. The modal loads them
 * when it opens, so the conversation page's props stay small.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<CronJobWithNames>> = async ({ req }) => {
    try {
        if (req.method != "GET") {
            return { success: false, msg: `Method not allowed` };
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const url = new URL(req.url);
        const bot_id = Number(url.searchParams.get("bot_id")) || undefined;
        const workspace_id = Number(url.searchParams.get("workspace_id")) || undefined;

        if (!bot_id) {
            return { success: false, msg: `Pick a bot.` };
        }

        const conversation = await grabUserConversation({ user_id: user.id, bot_id, workspace_id });

        return {
            success: true,
            payload: await grabCronJobs({
                user_id: user.id,
                bot_id: conversation.bot.id,
                workspace_id: conversation.workspace_id,
            }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
