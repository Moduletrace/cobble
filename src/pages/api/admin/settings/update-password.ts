import userAuth from "@/src/functions/backend/auth/user-auth";
import grabUserPasswordHash from "@/src/functions/backend/auth/grab-user-password-hash";
import verifyUserPassword from "@/src/functions/backend/auth/verify-user-password";
import setUserPassword from "@/src/functions/backend/auth/set-user-password";
import logEvent, { grabRequestIP } from "@/src/functions/backend/logger";
import { AppData } from "@/src/data/app-data";
import type { ApiReqParams } from "@/src/types";
import rateLimit from "@/src/utils/rate-limit";
import validatePassword from "@/src/utils/validate-password";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Sets or changes the logged-in user's own password. Acts only on the session user; changing an existing password
 * needs the current one.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
    body,
}) => {
    try {
        if (req.method != "POST") {
            throw new Error(`Method not allowed`);
        }

        const { user } = await userAuth({ req });

        if (!user?.logged_in_status || !user.id) {
            return {
                success: false,
                msg: `Unauthorized`,
                logoutUser: true,
            };
        }

        const user_id = user.id;
        const { password_update } = body as ApiReqParams;

        if (!password_update) {
            throw new Error(`No password update provided`);
        }

        const has_password = Boolean(await grabUserPasswordHash({ user_id }));

        if (has_password) {
            const attempts = rateLimit({
                key: `password-update:${user_id}`,
                limit: AppData["PasswordAttemptLimit"],
                window_ms: AppData["RateLimitWindowMinutes"] * 60 * 1000,
            });

            if (!attempts.allowed) {
                throw new Error(`Too many attempts. Please try again later.`);
            }

            const is_valid = password_update.current_password
                ? await verifyUserPassword({
                      user_id,
                      password: password_update.current_password,
                  })
                : false;

            if (!is_valid) {
                throw new Error(`Your current password is incorrect.`);
            }
        }

        const password_error = validatePassword({
            password: password_update.new_password,
        });

        if (password_error || !password_update.new_password) {
            throw new Error(password_error);
        }

        await setUserPassword({
            user_id,
            password: password_update.new_password,
        });

        await logEvent({
            title: has_password ? "Password changed" : "Password set",
            category: "auth",
            user_id,
            plain_text: `User #${user_id} ${has_password ? "changed" : "set"} their password.`,
            ip_address: grabRequestIP(req),
        });

        return {
            success: true,
            msg: has_password ? `Password changed.` : `Password set.`,
        };
    } catch (error: any) {
        return {
            success: false,
            msg: error.message,
        };
    }
};
