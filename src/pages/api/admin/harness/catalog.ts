import userAuth from "@/src/functions/backend/auth/user-auth";
import grabHarnessCatalog from "@/src/functions/backend/db/harness/grab-harness-catalog";
import type { HarnessCatalogPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * The install-wide models catalog: per harness, the providers and models
 * it can pick. The chat header's models modal fetches it once and keeps it
 * in `localStorage`, so every bot and workspace reuses it.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<HarnessCatalogPayload>
> = async ({ req }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (!canManageCrew({ user_types })) {
            throw new AppError(`Only an admin can see the model catalog.`);
        }

        return {
            success: true,
            singleRes: await grabHarnessCatalog(),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
