import userAuth from "@/src/functions/backend/auth/user-auth";
import grabPushSubscriptions from "@/src/functions/backend/db/push/grab-push-subscriptions";
import deliverToUser from "@/src/push/deliver-to-user";
import AppError from "@/src/utils/app-error";
import safeErrorMessage from "@/src/utils/safe-error-message";
import { SiteData } from "@/src/data/site-data";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Sends one notification to every device this user has subscribed, so
 * they can check that notifications arrive without waiting for a bot.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
}) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const subscriptions = await grabPushSubscriptions({
            user_id: user.id,
        });

        if (!subscriptions.length) {
            throw new AppError(
                `Turn notifications on for this device first, then try again.`,
            );
        }

        await deliverToUser({
            user_id: user.id,
            payload: {
                title: `${SiteData["SiteName"]} notifications are on`,
                body: "This is what a bot's message will look like.",
                url: "/admin/settings/notifications",
                tag: "cobble-test",
            },
        });

        return { success: true, msg: "Test sent." };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
