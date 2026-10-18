import issueSSOLoginCode from "@/src/functions/backend/auth/issue-sso-login-code";
import findUserByIdentifier from "@/src/functions/backend/auth/find-user-by-identifier";
import grabLoginMethod from "@/src/functions/backend/auth/grab-login-method";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { AppData } from "@/src/data/app-data";
import rateLimit from "@/src/utils/rate-limit";
import { LoginIdentifierRequestSchema } from "@/src/schemas/auth-schema";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import AppError from "@/src/utils/app-error";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Emails a password reset code (password login mode only). Also how
 * accounts without a password (e.g. created before password mode, or via
 * Google) set their first one.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
    body,
}) => {
    try {
        if (grabLoginMethod() != "password") {
            throw new AppError(`Password login is turned off.`);
        }

        const { login } = parseWithSchema({
            schema: LoginIdentifierRequestSchema,
            data: body,
        });

        const identifier = login.email_or_username;

        const window_ms = AppData["RateLimitWindowMinutes"] * 60 * 1000;

        const ip_limit = rateLimit({
            key: `password-reset:ip:${grabRequestIP(req) || "unknown"}`,
            limit: AppData["SSOCodeRequestLimit"] * 4,
            window_ms,
        });

        const identifier_limit = rateLimit({
            key: `password-reset:id:${identifier.toLowerCase()}`,
            limit: AppData["SSOCodeRequestLimit"],
            window_ms,
        });

        if (!ip_limit.allowed || !identifier_limit.allowed) {
            throw new AppError(`Too many requests. Please try again later.`);
        }

        const target_user = await findUserByIdentifier({ identifier });

        /**
         * Same response whether or not the account exists.
         */
        if (!target_user?.id || !target_user.email) {
            await logEvent({
                title: "Password reset requested for unknown user",
                category: "auth",
                plain_text: `Password reset requested for unknown identifier.`,
                ip_address: grabRequestIP(req),
            });

            return {
                success: true,
            };
        }

        await logEvent({
            title: "Password reset requested",
            category: "auth",
            user_id: target_user.id,
            plain_text: `User #${target_user.id} requested a password reset code.`,
            metadata: {
                user_id: target_user.id,
            },
            ip_address: grabRequestIP(req),
        });

        return issueSSOLoginCode({
            user_id: target_user.id,
            email: target_user.email,
            method: "reset",
        });
    } catch (error: unknown) {
        return {
            success: false,
            msg: safeErrorMessage({ error }),
        };
    }
};
