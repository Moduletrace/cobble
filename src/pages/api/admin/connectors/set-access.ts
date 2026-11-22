import userAuth from "@/src/functions/backend/auth/user-auth";
import grabConnectorConnections from "@/src/functions/backend/db/connectors/grab-connector-connections";
import setConnectorAccess from "@/src/functions/backend/db/connectors/set-connector-access";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SaveConnectorAccessRequestSchema } from "@/src/schemas/connector-schema";
import type { ConnectorConnectionsPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Super admin: makes a connector global (every bot, every user) or gives it
 * to workspaces. A bot attachment is a person's own and has its own route.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<ConnectorConnectionsPayload>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }

        const data = parseWithSchema({ schema: SaveConnectorAccessRequestSchema, data: body });
        const connector = await setConnectorAccess({ user_id: user.id, data });

        await logEvent({
            title: "Connector access changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} changed who gets the connector ${connector.name} (#${connector.id}).`,
            metadata: { ...data, connector_id: connector.id },
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: `Saved who gets ${connector.name}.`,
            singleRes: await grabConnectorConnections(),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
