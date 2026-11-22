import userAuth from "@/src/functions/backend/auth/user-auth";
import disconnectConnectorAccount from "@/src/functions/backend/db/connectors/disconnect-connector-account";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { DisconnectConnectorAccountSchema } from "@/src/schemas/connector-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * Disconnects one of the signed-in user's accounts, and nobody else's. The
 * provider's record goes too, best effort; what stays is its name, on the
 * page, only for the history.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<{ connector_id: number }>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }

        const { account_id } = parseWithSchema({ schema: DisconnectConnectorAccountSchema, data: body });
        const { connector, account } = await disconnectConnectorAccount({ user_id: user.id, account_id });

        await logEvent({
            title: "Connector account disconnected",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} disconnected their ${connector.name} account ${account.label}.`,
            metadata: { connector_id: connector.id, account_id: Number(account.id) },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: `Disconnected ${account.label}.`, singleRes: { connector_id: connector.id } };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
