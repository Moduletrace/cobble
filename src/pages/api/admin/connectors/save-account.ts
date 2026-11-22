import userAuth from "@/src/functions/backend/auth/user-auth";
import saveConnectorAccount from "@/src/functions/backend/db/connectors/save-connector-account";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SaveConnectorAccountRequestSchema } from "@/src/schemas/connector-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";
import type { ConnectorAccountRecord } from "@/src/types";

/**
 * Renames one sign-in the user owns (a super admin may rename anyone's): the
 * label is what the bot calls the account and what a conversation shows.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<ConnectorAccountRecord>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") throw new AppError(`Method not allowed`);

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }

        const data = parseWithSchema({ schema: SaveConnectorAccountRequestSchema, data: body });
        const account = await saveConnectorAccount({ user_id: user.id, data });

        await logEvent({
            title: "Connector account renamed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} renamed a connector account to ${account.label}.`,
            metadata: { connector_id: account.connector_id, account_id: Number(account.id) },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: `Saved as ${account.label}.`, singleRes: account };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};