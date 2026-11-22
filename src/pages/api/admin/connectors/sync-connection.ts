import userAuth from "@/src/functions/backend/auth/user-auth";
import assertSuperAdmin from "@/src/functions/backend/db/access/assert-super-admin";
import grabConnectorConnections from "@/src/functions/backend/db/connectors/grab-connector-connections";
import syncConnectorConnection from "@/src/functions/backend/db/connectors/sync-connector-connection";
import type { ConnectorConnectionsPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";
import { z } from "zod";

const SyncConnectionRequestSchema = z.object({
    connection_id: z.coerce.number().int().positive(),
});

/**
 * Reads a connection's apps again: every app its key holds is stored as a
 * connector, so nothing is added one by one. A super admin's alone, since a
 * connection is the install's.
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

        const { connection_id } = parseWithSchema({ schema: SyncConnectionRequestSchema, data: body });
        const result = await syncConnectorConnection({ connection_id, user_id: user.id });

        if (!result.ok) throw new AppError(result.error);

        return {
            success: true,
            msg: `${result.app_count} ${result.app_count == 1 ? "app" : "apps"} ready.`,
            singleRes: await grabConnectorConnections(),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};