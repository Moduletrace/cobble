import userAuth from "@/src/functions/backend/auth/user-auth";
import grabConnectorRequestView from "@/src/functions/backend/db/connectors/grab-connector-request-view";
import syncConnectorAccounts from "@/src/functions/backend/db/connectors/sync-connector-accounts";
import { ConnectorRequestIdSchema } from "@/src/schemas/connector-schema";
import type { ConnectorRequestPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Whether a connect request is done: reads the provider's own account list
 * first, so a sign-in finished in another tab counts, then the request.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<ConnectorRequestPayload>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { request_id } = parseWithSchema({ schema: ConnectorRequestIdSchema, data: body });
        const view = await grabConnectorRequestView({ request_id, user_id: user.id });

        if (view.status == "pending") {
            await syncConnectorAccounts({
                user_id: user.id,
                connector_id: view.connector_id,
                label: view.label,
            }).catch(() => {});
        }

        return {
            success: true,
            singleRes: await grabConnectorRequestView({ request_id, user_id: user.id }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
