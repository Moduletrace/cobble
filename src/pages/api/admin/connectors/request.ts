import userAuth from "@/src/functions/backend/auth/user-auth";
import grabConnectorRequestView from "@/src/functions/backend/db/connectors/grab-connector-request-view";
import type { ConnectorRequestPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * One connect request, for its `[connect:ID]` card: read by the user it
 * belongs to only.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<ConnectorRequestPayload>> = async ({ req }) => {
    try {
        if (req.method != "GET") throw new AppError(`Method not allowed`);

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const request_id = Number(new URL(req.url).searchParams.get("request_id")) || 0;

        if (!request_id) throw new AppError(`Nothing to read.`);

        return { success: true, singleRes: await grabConnectorRequestView({ request_id, user_id: user.id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
