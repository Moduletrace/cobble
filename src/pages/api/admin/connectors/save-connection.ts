import userAuth from "@/src/functions/backend/auth/user-auth";
import assertSuperAdmin from "@/src/functions/backend/db/access/assert-super-admin";
import grabConnectorConnections from "@/src/functions/backend/db/connectors/grab-connector-connections";
import saveConnectorConnection from "@/src/functions/backend/db/connectors/save-connector-connection";
import syncConnectorConnection from "@/src/functions/backend/db/connectors/sync-connector-connection";
import { ConnectorProviders } from "@/src/dict/connector-dict";
import type { ConnectorConnectionsPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";
import { z } from "zod";

const SaveConnectionRequestSchema = z.object({
    connection_id: z.coerce.number().int().positive().optional(),
    provider: z.enum(ConnectorProviders.map((provider) => provider.value)).default("composio"),
    name: z.string().trim().min(1, "Give the connection a name").max(80),
    api_key: z.string().trim().max(400).optional(),
});

/**
 * Adds a provider connection (Composio Personal, Composio Work, each with
 * its own key) or renames one and replaces its key, then lists its apps. A
 * super admin's alone, since a connection is the install's.
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

        const { connection_id, provider, name, api_key } = parseWithSchema({ schema: SaveConnectionRequestSchema, data: body });
        const saved = await saveConnectorConnection({ connection_id, provider, name, api_key, user_id: user.id });
        const synced = await syncConnectorConnection({ connection_id: saved.id, user_id: user.id });
        const msg = synced.ok ? `${saved.name}: ${synced.app_count} ${synced.app_count == 1 ? "app" : "apps"} ready.` : `${saved.name} is saved. ${synced.error}`;

        return {
            success: true,
            msg,
            singleRes: await grabConnectorConnections(),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};