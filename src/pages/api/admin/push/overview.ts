import userAuth from "@/src/functions/backend/auth/user-auth";
import grabPushOverview from "@/src/functions/backend/db/push/grab-push-overview";
import { ensureVapidKeys } from "@/src/push/vapid";
import AppError from "@/src/utils/app-error";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";
import type { PushOverview } from "@/src/types";

/**
 * The Notifications page refreshes this user's devices after a change
 * without a reload.
 */
export const handler: BunextAPIRouteHandler<
    APIResponseObject<PushOverview>
> = async ({ req }) => {
    try {
        if (req.method != "GET") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        return {
            success: true,
            singleRes: await grabPushOverview({
                user_id: user.id,
                public_key: (await ensureVapidKeys().catch(() => null))
                    ?.public_key,
            }),
        };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
