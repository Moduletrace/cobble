import userAuth from "@/src/functions/backend/auth/user-auth";
import grabSecretRequestView from "@/src/functions/backend/db/secret-requests/grab-secret-request-view";
import { SecretRequestIdSchema } from "@/src/schemas/secret-request-schema";
import type { SecretRequestView } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * `GET ?request_id=`: a secret a bot asked the session user for, as its
 * chip and card show it. Nobody else reads it.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<SecretRequestView>> = async ({ req, query }) => {
    try {
        if (req.method != "GET") {
            throw new AppError(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        const { request_id } = parseWithSchema({ schema: SecretRequestIdSchema, data: query });

        return { success: true, singleRes: await grabSecretRequestView({ request_id, user_id: user.id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
