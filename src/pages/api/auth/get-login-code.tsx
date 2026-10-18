import issueSSOLoginCode from "@/src/functions/backend/auth/issue-sso-login-code";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { AppData } from "@/src/data/app-data";
import rateLimit from "@/src/utils/rate-limit";
import findUserByIdentifier from "@/src/functions/backend/auth/find-user-by-identifier";
import grabLoginMethod from "@/src/functions/backend/auth/grab-login-method";
import { LoginIdentifierRequestSchema } from "@/src/schemas/auth-schema";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import AppError from "@/src/utils/app-error";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
    body,
}) => {
    try {
        if (grabLoginMethod() != "code") {
            throw new AppError(`Please log in with your password.`);
        }

        const { login } = parseWithSchema({
            schema: LoginIdentifierRequestSchema,
            data: body,
        });

        const window_ms = AppData["RateLimitWindowMinutes"] * 60 * 1000;

        const ip_limit = rateLimit({
            key: `sso-code-request:ip:${grabRequestIP(req) || "unknown"}`,
            limit: AppData["SSOCodeRequestLimit"] * 4,
            window_ms,
        });

        const identifier_limit = rateLimit({
            key: `sso-code-request:id:${String(login.email_or_username).toLowerCase()}`,
            limit: AppData["SSOCodeRequestLimit"],
            window_ms,
        });

        if (!ip_limit.allowed || !identifier_limit.allowed) {
            throw new AppError(`Too many requests. Please try again later.`);
        }

        const target_user = await findUserByIdentifier({
            identifier: login.email_or_username,
        });

        /**
         * Same response whether or not the account exists, so this
         * endpoint can't be used to enumerate users.
         */
        if (!target_user?.id || !target_user.email) {
            await logEvent({
                title: "SSO login code requested for unknown user",
                category: "auth",
                plain_text: `SSO login code requested for unknown identifier.`,
                ip_address: grabRequestIP(req),
            });

            return {
                success: true,
            };
        }

        await logEvent({
            title: "SSO login code requested",
            category: "auth",
            user_id: target_user.id,
            plain_text: `User #${target_user.id} [${target_user.first_name} ${target_user.last_name}] requested an SSO login code.`,
            metadata: {
                user_id: target_user.id,
            },
            ip_address: grabRequestIP(req),
        });

        return issueSSOLoginCode({
            user_id: target_user.id,
            email: target_user.email,
            method: "code",
        });
    } catch (error: unknown) {
        await logEvent({
            title: "SSO login code request failed",
            category: "auth",
            plain_text: `SSO login code request failed: ${
                error instanceof Error ? error.message : String(error)
            }`,
            ip_address: grabRequestIP(req),
        });

        return {
            success: false,
            msg: safeErrorMessage({ error }),
        };
    }
};