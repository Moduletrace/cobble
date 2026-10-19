import userAuth from "@/src/functions/backend/auth/user-auth";
import savePushSubscription from "@/src/functions/backend/db/push/save-push-subscription";
import { SavePushSubscriptionSchema } from "@/src/schemas/push-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Saves this device's push subscription for the session user. The
 * endpoint is unique, so subscribing again only refreshes the keys.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const data = parseWithSchema({
            schema: SavePushSubscriptionSchema,
            data: body,
        });

        await savePushSubscription({
            user_id: user.id,
            endpoint: data.endpoint,
            p256dh: data.keys.p256dh,
            auth: data.keys.auth,
            user_agent: data.user_agent,
            platform: data.platform,
        });

        return { success: true, msg: "Notifications are on for this device." };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
