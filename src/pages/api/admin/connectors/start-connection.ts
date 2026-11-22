import userAuth from "@/src/functions/backend/auth/user-auth";
import startConnectorConnection from "@/src/functions/backend/db/connectors/start-connector-connection";
import { StartConnectorConnectionRequestSchema } from "@/src/schemas/connector-schema";
import type { ConnectorAccountRecord, ConnectorRequestPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

type Payload = {
    request: ConnectorRequestPayload | null;
    accounts: ConnectorAccountRecord[];
};

/**
 * Starts a sign-in for one connector as the signed-in user. The provider's
 * own link comes back for the page to open; nothing about the credentials
 * ever reaches this app.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<Payload>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }

        const data = parseWithSchema({ schema: StartConnectorConnectionRequestSchema, data: body });
        const result = await startConnectorConnection({ user_id: user.id, ...data });

        return {
            success: true,
            msg: result.request ? `Open the sign-in page to connect ${result.request.connector_name}.` : `Already connected.`,
            singleRes: result,
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
