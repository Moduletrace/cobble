import userAuth from "@/src/functions/backend/auth/user-auth";
import grabConnectorConnections from "@/src/functions/backend/db/connectors/grab-connector-connections";
import type { ConnectorConnectionsPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * The connectors page's connections. Its apps are read one page at a time
 * from `connectors/apps`, since a connection can hold thousands.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<ConnectorConnectionsPayload>> = async ({ req }) => {
    try {
        if (req.method != "GET") throw new AppError(`Method not allowed`);

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        return { success: true, singleRes: await grabConnectorConnections() };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};