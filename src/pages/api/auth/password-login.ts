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

/**
 * Logs a user in with their email or username and password.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
    body,
}) => {
    try {
        const { login } = parseWithSchema({
            schema: PasswordLoginRequestSchema,
            data: body,
        });

        const identifier = login.email_or_username;
        const password = login.password;

        const window_ms = AppData["RateLimitWindowMinutes"] * 60 * 1000;

        const ip_limit = rateLimit({
            key: `password-login:ip:${grabRequestIP(req) || "unknown"}`,
            limit: AppData["PasswordAttemptLimit"] * 4,
            window_ms,
        });

        const identifier_limit = rateLimit({
            key: `password-login:id:${identifier.toLowerCase()}`,
            limit: AppData["PasswordAttemptLimit"],
            window_ms,
        });

        if (!ip_limit.allowed || !identifier_limit.allowed) {
            throw new AppError(`Too many attempts. Please try again later.`);
        }

        const target_user = await findUserByIdentifier({ identifier });

        const is_valid = await verifyUserPassword({
            user_id: target_user?.id,
            password,
        });

        if (!is_valid || !target_user?.id) {
            await logEvent({
                title: "Password login failed",
                category: "auth",
                user_id: target_user?.id || undefined,
                plain_text: target_user?.id
                    ? `Wrong password for user #${target_user.id}.`
                    : `Password login attempted for unknown identifier.`,
                ip_address: grabRequestIP(req),
            });

            return {
                success: false,
                msg: `Incorrect email, username or password.`,
            };
        }

        return await loginUser({
            user_id: target_user.id,
            req,
        });
    } catch (error: unknown) {
        return {
            success: false,
            msg: safeErrorMessage({ error }),
        };
    }
};
