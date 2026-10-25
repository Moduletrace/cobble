import userAuth from "@/src/functions/backend/auth/user-auth";
import declineSecretRequest from "@/src/functions/backend/db/secret-requests/decline-secret-request";
import grabSecretRequestView from "@/src/functions/backend/db/secret-requests/grab-secret-request-view";
import { SecretRequestIdSchema } from "@/src/schemas/secret-request-schema";
import type { SecretRequestView } from "@/src/types";
import AppError from "@/src/utils/app-error";
import parseWithSchema from "@/src/utils/parse-with-schema";
import isReadOnlyUser from "@/src/utils/rbac/is-read-only-user";
import safeErrorMessage from "@/src/utils/safe-error-message";
import type { APIResponseObject, BunextAPIRouteHandler } from "@moduletrace/bunext/types";

/**
 * The session user declined a secret a bot asked them for: nothing saved.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject<SecretRequestView>> = async ({ req, body }) => {
    try {
        if (req.method != "POST") {
            throw new AppError(`Method not allowed`);
        }

        const { user, user_types } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return { success: false, msg: `Unauthorized`, logoutUser: true };
        }

        if (isReadOnlyUser({ user_types: user_types || [] })) {
            throw new AppError(`This user can only read records.`);
        }

        const { request_id } = parseWithSchema({ schema: SecretRequestIdSchema, data: body });

        await declineSecretRequest({ request_id, user_id: user.id });

        return { success: true, singleRes: await grabSecretRequestView({ request_id, user_id: user.id }) };
    } catch (error: unknown) {
        return { success: false, msg: safeErrorMessage({ error }) };
    }
};
