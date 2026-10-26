import userAuth from "@/src/functions/backend/auth/user-auth";
import grabKnowledgebasesOverview from "@/src/functions/backend/db/knowledgebases/grab-knowledgebases-overview";
import type { KnowledgebasesOverviewPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Super admins and admins: the Knowledgebases page's list again, after its
 * documents changed (their counts and how much of each is read).
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<KnowledgebasesOverviewPayload>
> = async ({ req }) => {
    try {
        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (!canManageCrew({ user_types })) {
            throw new AppError(`Only an admin can do that.`);
        }

        return { success: true, singleRes: await grabKnowledgebasesOverview({ user_id: user.id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
