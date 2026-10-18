import createSuperAdminUser from "@/src/functions/backend/auth/create-super-admin-user";
import setUserPassword from "@/src/functions/backend/auth/set-user-password";
import grabHasUsers from "@/src/functions/backend/auth/grab-has-users";
import loginUser from "@/src/functions/backend/auth/login-user";
import ensureCoordinatorBot from "@/src/functions/backend/db/bots/ensure-coordinator-bot";
import validatePassword from "@/src/utils/validate-password";
import logEvent, { grabRequestIP, logError } from "@/src/functions/backend/logger";
import { AppData } from "@/src/data/app-data";
import rateLimit from "@/src/utils/rate-limit";
import { SignupRequestSchema } from "@/src/schemas/auth-schema";
import parseWithSchema from "@/src/utils/parse-with-schema";
import safeErrorMessage from "@/src/utils/safe-error-message";
import AppError from "@/src/utils/app-error";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * First-run setup: creates the super admin and their coordinator bot, then
 * logs them in. Refused once
 * any account exists, so signup can only ever happen once per install.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
    body,
}) => {
    try {
        const ip_limit = rateLimit({
            key: `signup:ip:${grabRequestIP(req) || "unknown"}`,
            limit: AppData["PasswordAttemptLimit"],
            window_ms: AppData["RateLimitWindowMinutes"] * 60 * 1000,
        });

        if (!ip_limit.allowed) {
            throw new AppError(`Too many requests. Please try again later.`);
        }

        if (await grabHasUsers()) {
            throw new AppError(`This install has already been set up.`);
        }

        const { signup } = parseWithSchema({
            schema: SignupRequestSchema,
            data: body,
        });

        const email = signup.email.trim().toLowerCase();
        const username = signup.username.trim().toLowerCase();

        if (!AppData["UsernameRegex"].test(username)) {
            throw new AppError(
                `Usernames must be 3-32 characters: lowercase letters, numbers, dots, dashes or underscores`,
            );
        }

        const password_error = validatePassword({ password: signup.password });

        if (password_error) {
            throw new AppError(password_error);
        }

        const new_user_id = await createSuperAdminUser({
            first_name: signup.first_name.trim(),
            last_name: signup.last_name?.trim(),
            email,
            username,
        });

        await setUserPassword({
            user_id: new_user_id,
            password: signup.password,
        });

        /**
         * The account exists now, so a failure here mustn't fail signup
         * (which is one-shot). `/admin/bots` creates it on the next visit.
         */
        await ensureCoordinatorBot({ user_id: new_user_id }).catch((error) =>
            logError({
                title: "Coordinator bot not created at signup",
                error,
                user_id: new_user_id,
                ip_address: grabRequestIP(req),
            }).catch(() => {}),
        );

        await logEvent({
            title: "Super admin created",
            category: "auth",
            user_id: new_user_id,
            plain_text: `User #${new_user_id} created the super admin account.`,
            metadata: {
                user_id: new_user_id,
            },
            ip_address: grabRequestIP(req),
        });

        return await loginUser({
            user_id: new_user_id,
            req,
        });
    } catch (error: unknown) {
        await logError({
            title: "Signup failed",
            error,
            ip_address: grabRequestIP(req),
        }).catch(() => {});

        return {
            success: false,
            msg: safeErrorMessage({ error }),
        };
    }
};
