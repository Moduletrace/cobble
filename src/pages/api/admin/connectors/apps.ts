import userAuth from "@/src/functions/backend/auth/user-auth";
import grabConnectorApps from "@/src/functions/backend/db/connectors/grab-connector-apps";
import { ConnectorAppFilters } from "@/src/dict/connector-dict";
import type { ConnectorAppsPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * One page of a connection's apps, with the viewer's accounts and where each
 * is attached for them. `q` searches the apps; `page` picks the slice.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<ConnectorAppsPayload>> = async ({ req }) => {
    try {
        if (req.method != "GET") throw new AppError(`Method not allowed`);

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const params = new URL(req.url).searchParams;
        const connection_id = Number(params.get("connection_id")) || 0;
        const asked = params.get("filter") || "all";
        const filter = ConnectorAppFilters.find((entry) => entry.value == asked)?.value || "all";

        if (!connection_id) throw new AppError(`Nothing to read.`);

        return {
            success: true,
            singleRes: await grabConnectorApps({
                user_id: user.id,
                connection_id,
                query: params.get("q") || "",
                filter,
                page: Number(params.get("page")) || 1,
            }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};