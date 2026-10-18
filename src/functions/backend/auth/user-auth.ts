import { AppData } from "@/src/data/app-data";
import { getCookie } from "@/src/utils/cookies";
import { decrypt } from "@/src/utils/crypt";
import { safeCompare } from "@/src/utils/safe-compare";
import grabUserAuthTypes from "./grab-user-auth-types";
import type { User, UserAuthReturn } from "@/src/types";

type Params = {
    req: Request;
};

export default async function userAuth({
    req,
}: Params): Promise<UserAuthReturn> {
    try {
        const auth_key_cookie = getCookie(req, AppData["AuthKeyCookieName"]);
        const auth_csrf_cookie = getCookie(req, AppData["AuthCSRFCookieName"]);
        const now = Date.now();

        if (!auth_key_cookie) throw new Error(`Auth Key not found!`);

        if (!auth_csrf_cookie) throw new Error(`Auth CSRF not found!`);

        const decrypted_key = await decrypt(auth_key_cookie);
        const decrypted_user_payload = JSON.parse(decrypted_key) as User;

        if (!decrypted_user_payload?.id) throw new Error(`Invalid Key`);
        if (!decrypted_user_payload.date) throw new Error(`Key has no date!`);

        if (!decrypted_user_payload.csrf) throw new Error(`Key has no CSRF!`);

        if (!safeCompare(decrypted_user_payload.csrf, auth_csrf_cookie)) {
            throw new Error(`CSRF Mismatch`);
        }

        const time_elapsed = now - decrypted_user_payload.date;
        const expiry_time = AppData["AuthExpiryDays"] * 24 * 60 * 60 * 1000;

        if (time_elapsed > expiry_time) {
            throw new Error(`Key Expired`);
        }

        const user_auth_types = await grabUserAuthTypes({
            user_id: decrypted_user_payload.id,
        });

        if (!user_auth_types.success) {
            return user_auth_types;
        }

        return {
            success: true,
            user: decrypted_user_payload,
            user_types: user_auth_types.user_types,
        };
    } catch (error: any) {
        return {
            success: false,
            msg: error.message,
        };
    }
}
