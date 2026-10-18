import type {
    BUN_SQLITE_BSQLITE_SSO_LOGIN_CODES,
    BunSQLiteTables,
} from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type { SSOAuth, SSOMethod } from "@/src/types";
import { getCookie } from "@/src/utils/cookies";
import { decrypt } from "@/src/utils/crypt";
import EJSON from "@/src/utils/ejson";
import { safeCompare } from "@/src/utils/safe-compare";
import rateLimit, { resetRateLimit } from "@/src/utils/rate-limit";
import BunSQLite from "@moduletrace/bun-sqlite";
import deleteUserSSOCodes from "./delete-user-sso-codes";
import AppError from "@/src/utils/app-error";

type Params = {
    req: Request;
    sso_code?: string | number;
    /**
     * The code's issuing method must match, e.g. a reset code can't
     * complete a login.
     */
    method: SSOMethod;
};

/**
 * Checks an emailed code against the pending login in the SSO cookie.
 * Returns the user id on success, throws a user-facing error otherwise.
 */
export default async function verifySSOCode({
    req,
    sso_code,
    method,
}: Params) {
    const sso_cookie = getCookie(req, AppData["SSOAuthCookieName"]);

    if (!sso_cookie) {
        throw new AppError(`No login in progress. Please start again.`);
    }

    if (!sso_code) {
        throw new AppError(`Please enter your code.`);
    }

    const sso_auth = EJSON.parse(await decrypt(sso_cookie)) as SSOAuth;

    if (!sso_auth?.user_id) {
        throw new AppError(`Invalid login session. Please start again.`);
    }

    const user_id = sso_auth.user_id;

    if (sso_auth.method != method) {
        await deleteUserSSOCodes({ user_id });
        throw new AppError(`This code can't be used here. Please start again.`);
    }

    const attempts_key = `sso-login:${user_id}`;

    const attempts = rateLimit({
        key: attempts_key,
        limit: AppData["SSOMaxCodeAttempts"],
        window_ms: AppData["SSOCodeExpiryMinutes"] * 60 * 1000,
    });

    if (!attempts.allowed) {
        await deleteUserSSOCodes({ user_id });
        throw new AppError(`Too many attempts. Please request a new code.`);
    }

    const target_sso = (
        await BunSQLite.select<
            BUN_SQLITE_BSQLITE_SSO_LOGIN_CODES,
            (typeof BunSQLiteTables)[number]
        >({
            table: "sso_login_codes",
            query: {
                query: {
                    user_id: {
                        value: user_id,
                    },
                },
            },
        })
    ).singleRes;

    if (
        !target_sso?.code ||
        !safeCompare(String(target_sso.code), String(sso_code))
    ) {
        throw new AppError(`Invalid Code!`);
    }

    const time_elapsed = Date.now() - Number(target_sso.updated_at);
    const expiry_time = AppData["SSOCodeExpiryMinutes"] * 60 * 1000;

    if (time_elapsed > expiry_time) {
        await deleteUserSSOCodes({ user_id });
        throw new AppError(`Code Expired. Please start again.`);
    }

    resetRateLimit({ key: attempts_key });

    return user_id;
}
