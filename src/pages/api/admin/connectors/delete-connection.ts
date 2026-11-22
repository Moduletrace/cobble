import userAuth from "@/src/functions/backend/auth/user-auth";
import assertSuperAdmin from "@/src/functions/backend/db/access/assert-super-admin";
import deleteConnectorConnection from "@/src/functions/backend/db/connectors/delete-connector-connection";
import grabConnectorConnections from "@/src/functions/backend/db/connectors/grab-connector-connections";
import type { ConnectorConnectionsPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";
import { z } from "zod";

const DeleteConnectionRequestSchema = z.object({
    connection_id: z.coerce.number().int().positive(),
});

/**
 * Removes a connection with the apps it read and everything attached to
 * them. A super admin's alone.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<ConnectorConnectionsPayload>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        assertSuperAdmin({ user_id: user.id });
        if (isReadOnlyUser({ user_types })) throw new AppError(`You can't change this account.`);

        const { connection_id } = parseWithSchema({ schema: DeleteConnectionRequestSchema, data: body });
        const removed = await deleteConnectorConnection({ connection_id });

        return {
            success: true,
            msg: `${removed.name} is gone, with ${removed.apps} ${removed.apps == 1 ? "app" : "apps"}.`,
            singleRes: await grabConnectorConnections(),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};