import userAuth from "@/src/functions/backend/auth/user-auth";
import grabConnectorOwnAccounts from "@/src/functions/backend/db/connectors/grab-connector-own-accounts";
import type { ConnectorAccountRecord } from "@/src/types";
import AppError from "@/src/utils/app-error";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * This user's own accounts of one app. The tools modal's picker lists them
 * under the app, so an account can be given to the bot there.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<ConnectorAccountRecord[]>> = async ({ req }) => {
    try {
        if (req.method != "GET") throw new AppError(`Method not allowed`);

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const params = new URL(req.url).searchParams;
        const connector_id = Number(params.get("connector_id")) || 0;

        if (!connector_id) throw new AppError(`Nothing to read.`);

        return {
            success: true,
            singleRes: await grabConnectorOwnAccounts({
                user_id: user.id,
                connector_id,
                bot_id: Number(params.get("bot_id")) || 0,
                workspace_id: Number(params.get("workspace_id")) || 0,
            }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
