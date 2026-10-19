import userAuth from "@/src/functions/backend/auth/user-auth";
import deletePushSubscription from "@/src/functions/backend/db/push/delete-push-subscription";
import { PushEndpointRequestSchema } from "@/src/schemas/push-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Forgets this device. The browser also drops its own subscription first,
 * so the two never disagree for long.
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

        const { endpoint } = parseWithSchema({
            schema: PushEndpointRequestSchema,
            data: body,
        });

        await deletePushSubscription({ user_id: user.id, endpoint });

        return { success: true, msg: "Notifications are off for this device." };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
