import findUserByIdentifier from "@/src/functions/backend/auth/find-user-by-identifier";
import verifyUserPassword from "@/src/functions/backend/auth/verify-user-password";
import loginUser from "@/src/functions/backend/auth/login-user";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { AppData } from "@/src/data/app-data";
import rateLimit from "@/src/utils/rate-limit";
import { PasswordLoginRequestSchema } from "@/src/schemas/auth-schema";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import AppError from "@/src/utils/app-error";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";
import userAuth from "@/src/functions/backend/auth/user-auth";

/**
 * Re-authenticate a logged in user
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
}) => {
    try {
        const { user } = await userAuth({ req });

        if (!user?.logged_in_status) {
            return {
                success: false,
                msg: `Unauthorized`,
            };
        }

        return await loginUser({
            user_id: user.id,
            req,
        });
    } catch (error: unknown) {
        return {
            success: false,
            msg: safeErrorMessage({ error }),
        };
    }
};
