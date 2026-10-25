import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserConversation from "@/src/functions/backend/db/bot-sessions/grab-user-conversation";
import grabBotHooks from "@/src/functions/backend/db/bot-hooks/grab-bot-hooks";
import type { BotHookWithNames } from "@/src/types";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * One conversation's hooks of the session user: a bot's own in its chat
 * (`?workspace_id=` left out) or the ones that run in that workspace. The
 * modal loads them when it opens, so the page's props stay small.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotHookWithNames>> = async ({ req }) => {
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
            payload: await grabBotHooks({
                user_id: user.id,
                bot_id: conversation.bot.id,
                workspace_id: conversation.workspace_id,
            }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
