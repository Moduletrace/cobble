import userAuth from "@/src/functions/backend/auth/user-auth";
import grabConnectorAccount from "@/src/functions/backend/db/connectors/grab-connector-account";
import syncConnectorAccounts from "@/src/functions/backend/db/connectors/sync-connector-accounts";
import { DisconnectConnectorAccountSchema } from "@/src/schemas/connector-schema";
import { ConnectorAccountStatuses } from "@/src/dict/connector-dict";
import type { ConnectorAccountRecord } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

type Payload = {
    connector_id: number;
    account: ConnectorAccountRecord;
};

/**
 * Re-reads one of the signed-in user's accounts at its provider, so a
 * sign-in finished on another device shows here without a reload.
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

        const { account_id } = parseWithSchema({ schema: DisconnectConnectorAccountSchema, data: body });
        const own = await grabConnectorAccount({ user_id: user.id, account_id });

        await syncConnectorAccounts({ user_id: user.id, connector_id: own.connector_id });
        const account = await grabConnectorAccount({ user_id: user.id, account_id });
        const title = ConnectorAccountStatuses.find((entry) => entry.value == account.status)?.title || account.status;

        return {
            success: true,
            msg: account.status == "connected" ? `${account.label} is connected.` : `${account.label} is still ${title.toLowerCase()}.`,
            singleRes: { connector_id: own.connector_id, account },
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
