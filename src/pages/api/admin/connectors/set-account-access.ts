import userAuth from "@/src/functions/backend/auth/user-auth";
import setConnectorAccountAccess from "@/src/functions/backend/db/connectors/set-connector-account-access";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { SaveConnectorAccountAccessRequestSchema } from "@/src/schemas/connector-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";
import type { ConnectorAccountRecord } from "@/src/types";

/**
 * Where one sign-in may be used: its owner's runs always, plus every run in
 * the chosen workspaces or on the chosen bots, or everywhere. The owner sets
 * it; a super admin may set it on anyone's account.
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

        const data = parseWithSchema({ schema: SaveConnectorAccountAccessRequestSchema, data: body });
        const account = await setConnectorAccountAccess({ user_id: user.id, data });

        await logEvent({
            title: "Connector account reach changed",
            category: "system",
            user_id: user.id,
            plain_text: `User #${user.id} changed where connector account ${account.label} may be used.`,
            metadata: {
                connector_id: account.connector_id,
                account_id: Number(account.id),
                workspace_ids: account.workspace_ids,
                bot_ids: account.bot_ids,
                all_bots: account.all_bots,
            },
            ip_address: grabRequestIP(req),
        });

        return { success: true, msg: `Saved where ${account.label} may be used.`, singleRes: account };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};