import type { BUN_SQLITE_BSQLITE_USERS, BunSQLiteTables } from "@/db/types/db";
import issueSSOLoginCode from "@/src/functions/backend/auth/issue-sso-login-code";
import createSignupUser from "@/src/functions/backend/auth/create-signup-user";
import setUserPassword from "@/src/functions/backend/auth/set-user-password";
import grabLoginMethod from "@/src/functions/backend/auth/grab-login-method";
import validatePassword from "@/src/utils/validate-password";
import { grabRequestIP, logError } from "@/src/functions/backend/logger";
import { AppData } from "@/src/data/app-data";
import rateLimit from "@/src/utils/rate-limit";
import BunSQLite from "@moduletrace/bun-sqlite";
import { SignupRequestSchema } from "@/src/schemas/auth-schema";
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
        const { signup } = parseWithSchema({
            schema: SignupRequestSchema,
            data: body,
        });

        const email = signup.email.trim().toLowerCase();
        const username = signup.username.trim().toLowerCase();

        const window_ms = AppData["RateLimitWindowMinutes"] * 60 * 1000;

        const ip_limit = rateLimit({
            key: `signup:ip:${grabRequestIP(req) || "unknown"}`,
            limit: AppData["SSOCodeRequestLimit"] * 4,
            window_ms,
        });

        const email_limit = rateLimit({
            key: `signup:email:${email}`,
            limit: AppData["SSOCodeRequestLimit"],
            window_ms,
        });

        if (!ip_limit.allowed || !email_limit.allowed) {
            throw new AppError(`Too many requests. Please try again later.`);
        }

        if (!AppData["UsernameRegex"].test(username)) {
            throw new AppError(
                `Usernames must be 3-32 characters: lowercase letters, numbers, dots, dashes or underscores`,
            );
        }

        const login_method = grabLoginMethod();

        const password_error =
            login_method == "password"
                ? validatePassword({ password: signup.password })
                : undefined;

        if (password_error) {
            throw new AppError(password_error);
        }

        const existing_email_user = (
            await BunSQLite.select<
                BUN_SQLITE_BSQLITE_USERS,
                (typeof BunSQLiteTables)[number]
            >({
                table: "users",
                query: {
                    query: {
                        email: {
                            value: email,
                        },
                    },
                },
            })
        )?.singleRes;

        /**
         * Respond exactly as a fresh signup would, so this endpoint can't
         * be used to discover which emails have accounts. In code mode the
         * owner gets a login code. In password mode nothing is sent, since
         * a code alone mustn't skip their password.
         */
        if (existing_email_user?.id) {
            if (login_method == "password") {
                return {
                    success: true,
                };
            }

            return issueSSOLoginCode({
                user_id: existing_email_user.id,
                email,
                method: "code",
            });
        }

        const existing_username_user = (
            await BunSQLite.select<
                BUN_SQLITE_BSQLITE_USERS,
                (typeof BunSQLiteTables)[number]
            >({
                table: "users",
                query: {
                    query: {
                        username: {
                            value: username,
                        },
                    },
                },
            })
        )?.singleRes;

        if (existing_username_user?.id) {
            throw new AppError(
                `That username is taken. Please choose another.`,
            );
        }

        const new_user_id = await createSignupUser({
            first_name: signup.first_name.trim(),
            last_name: signup.last_name?.trim(),
            email,
            username,
        });

        if (login_method == "password" && signup.password) {
            await setUserPassword({
                user_id: new_user_id,
                password: signup.password,
            });
        }

        return issueSSOLoginCode({
            user_id: new_user_id,
            email,
            method: login_method,
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
