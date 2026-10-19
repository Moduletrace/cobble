import userAuth from "@/src/functions/backend/auth/user-auth";
import deletePushSubscriptionById from "@/src/functions/backend/db/push/delete-push-subscription-by-id";
import { PushSubscriptionIdRequestSchema } from "@/src/schemas/push-schema";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Removes one of the session user's devices from the settings list. Its
 * browser keeps its own subscription until it turns notifications off
 * there, which also removes it again on the next subscribe/unsubscribe.
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

        const { id } = parseWithSchema({
            schema: PushSubscriptionIdRequestSchema,
            data: body,
        });

        await deletePushSubscriptionById({ user_id: user.id, id });

        return { success: true, msg: "Device removed." };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
