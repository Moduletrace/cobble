import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserBot from "@/src/functions/backend/db/bots/grab-user-bot";
import grabBotConnectors from "@/src/functions/backend/db/connectors/grab-bot-connectors";
import type { BotConnectorEntry } from "@/src/types";
import AppError from "@/src/utils/app-error";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * The connectors one conversation's bot can use for this user, with their
 * own accounts of each, for the composer's tools modal.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<BotConnectorEntry[]>> = async ({ req }) => {
    try {
        if (req.method != "GET") throw new AppError(`Method not allowed`);

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const params = new URL(req.url).searchParams;
        const bot_id = Number(params.get("bot_id")) || 0;

        if (!bot_id) throw new AppError(`Nothing to read.`);

        const bot = await grabUserBot({ user_id: user.id, bot_id });

        if (!bot) throw new AppError(`You can't reach that bot.`);

        const workspace_id = Number(params.get("workspace_id")) || null;

        return {
            success: true,
            singleRes: await grabBotConnectors({
                user_id: user.id,
                bot_id,
                workspace_id,
            }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};