import loginUser from "@/src/functions/backend/auth/login-user";
import verifySSOCode from "@/src/functions/backend/auth/verify-sso-code";
import setUserPassword from "@/src/functions/backend/auth/set-user-password";
import grabLoginMethod from "@/src/functions/backend/auth/grab-login-method";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import validatePassword from "@/src/utils/validate-password";
import { ResetPasswordRequestSchema } from "@/src/schemas/auth-schema";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import AppError from "@/src/utils/app-error";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Completes a password reset: checks the emailed reset code, saves the new
 * password, then logs the user in. The emailed code is the proof of
 * identity here, as with any email-based reset.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
    body,
}) => {
    try {
        if (grabLoginMethod() != "password") {
            throw new AppError(`Password login is turned off.`);
        }

        const { sso_code, new_password } = parseWithSchema({
            schema: ResetPasswordRequestSchema,
            data: body,
        });

        const password_error = validatePassword({ password: new_password });

        if (password_error) {
            throw new AppError(password_error);
        }

        const user_id = await verifySSOCode({
            req,
            sso_code,
            method: "reset",
        });

        await setUserPassword({ user_id, password: new_password });

        await logEvent({
            title: "Password reset",
            category: "auth",
            user_id,
            plain_text: `User #${user_id} reset their password.`,
            metadata: {
                user_id,
            },
            ip_address: grabRequestIP(req),
        });

        return await loginUser({
            user_id,
            req,
        });
    } catch (error: unknown) {
        await logEvent({
            title: "Password reset failed",
            category: "auth",
            plain_text: `Password reset failed: ${
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
