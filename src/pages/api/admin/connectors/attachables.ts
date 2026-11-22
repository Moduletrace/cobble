import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserBot from "@/src/functions/backend/db/bots/grab-user-bot";
import grabAttachableConnectors from "@/src/functions/backend/db/connectors/grab-attachable-connectors";
import type { AttachableConnector } from "@/src/types";
import AppError from "@/src/utils/app-error";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * The apps this user can add to a bot from its tools modal, searched by
 * name or app. A bot-level connector is personal, so these are the rows
 * this user would make.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<AttachableConnector[]>> = async ({ req }) => {
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

        return {
            success: true,
            singleRes: await grabAttachableConnectors({
                user_id: user.id,
                bot_id,
                query: params.get("q") || "",
                connection_id: Number(params.get("connection_id")) || 0,
                workspace_id: Number(params.get("workspace_id")) || 0,
            }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};