import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUsageOverview from "@/src/functions/backend/db/usage/grab-usage-overview";
import { UsageRequestSchema } from "@/src/schemas/usage-schema";
import type { UsageOverview } from "@/src/types";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * What the install's models spent over a period: in total, per day, per
 * harness and per model. Super admins and admins only, since it is the
 * whole install's work rather than one user's conversation.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<UsageOverview>> = async ({ req, query }) => {
    try {
        if (req.method != "GET") {
            return { success: false, msg: `Method not allowed` };
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (!canManageCrew({ user_types })) {
            return { success: false, msg: `You don't manage the crew.` };
        }

        const request = parseWithSchema({ schema: UsageRequestSchema, data: query });

        return {
            success: true,
            singleRes: await grabUsageOverview({ days: request.days }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
