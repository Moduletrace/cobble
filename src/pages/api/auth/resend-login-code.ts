import type { BUN_SQLITE_BSQLITE_USERS, BunSQLiteTables } from "@/db/types/db";
import issueSSOLoginCode from "@/src/functions/backend/auth/issue-sso-login-code";
import { grabRequestIP } from "@/src/functions/backend/logger";
import grabLoginMethod from "@/src/functions/backend/auth/grab-login-method";
import { AppData } from "@/src/data/app-data";
import type { SSOAuth } from "@/src/types";
import { getCookie } from "@/src/utils/cookies";
import { decrypt } from "@/src/utils/crypt";
import EJSON from "@/src/utils/ejson";
import rateLimit from "@/src/utils/rate-limit";
import BunSQLite from "@moduletrace/bun-sqlite";
import safeErrorMessage from "@/src/utils/safe-error-message";
import AppError from "@/src/utils/app-error";
import type {
    APIResponseObject,
    BunextAPIRouteHandler,
} from "@moduletrace/bunext/types";

/**
 * Re-sends the login code for the pending login held in the SSO cookie.
 * The cookie is only issued once the first step has passed, and only
 * codes for the current login method (or a password reset) are resent.
 */
export const handler: BunextAPIRouteHandler<APIResponseObject> = async ({
    req,
}) => {
    try {
        const window_ms = AppData["RateLimitWindowMinutes"] * 60 * 1000;

        const ip_limit = rateLimit({
            key: `sso-resend:ip:${grabRequestIP(req) || "unknown"}`,
            limit: AppData["SSOCodeRequestLimit"] * 4,
            window_ms,
        });

        if (!ip_limit.allowed) {
            throw new AppError(`Too many requests. Please try again later.`);
        }

        const sso_cookie = getCookie(req, AppData["SSOAuthCookieName"]);

        /**
         * No pending login (e.g. the identifier didn't match an account).
         * Answer like a real resend so this can't be used to probe.
         */
        if (!sso_cookie) {
            return {
                success: true,
            };
        }

        const sso_auth = EJSON.parse(await decrypt(sso_cookie)) as SSOAuth;

        const max_age_ms = AppData["SSOPendingLoginMaxMinutes"] * 60 * 1000;
        const login_method = grabLoginMethod();

        const is_current_method =
            sso_auth?.method == login_method ||
            (login_method == "password" && sso_auth?.method == "reset");

        if (
            !sso_auth?.user_id ||
            !sso_auth.method ||
            !is_current_method ||
            !sso_auth.first_step_at ||
            Date.now() - sso_auth.first_step_at > max_age_ms
        ) {
            throw new AppError(`Your login session expired. Please start again.`);
        }

        const user_limit = rateLimit({
            key: `sso-resend:user:${sso_auth.user_id}`,
            limit: AppData["SSOCodeRequestLimit"],
            window_ms,
        });

        if (!user_limit.allowed) {
            throw new AppError(`Too many requests. Please try again later.`);
        }

        const target_user = (
            await BunSQLite.select<
                BUN_SQLITE_BSQLITE_USERS,
                (typeof BunSQLiteTables)[number]
            >({
                table: "users",
                targetId: sso_auth.user_id,
            })
        ).singleRes;

        if (!target_user?.id || !target_user.email) {
            throw new AppError(`Your login session expired. Please start again.`);
        }

        return issueSSOLoginCode({
            user_id: target_user.id,
            email: target_user.email,
            method: sso_auth.method,
            first_step_at: sso_auth.first_step_at,
        });
    } catch (error: unknown) {
        return {
            success: false,
            msg: safeErrorMessage({ error }),
        };
    }
};
