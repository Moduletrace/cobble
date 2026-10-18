import { AppData } from "@/src/data/app-data";
import { setCookies } from "@/src/utils/cookies";
import { encrypt } from "@/src/utils/crypt";
import grabUsers from "../db/users/grab-users";
import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_BSQLITE_MEDIA,
    BUN_SQLITE_BSQLITE_USER_TYPES,
    BunSQLiteTables,
} from "@/db/types/db";
import generateCSRF from "./gen-csrf";
import type { User } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import grabMediaURL from "../media/grab-media-url";
import logEvent, { grabRequestIP } from "../logger";
import deleteUserSSOCodes from "./delete-user-sso-codes";
import AppError from "@/src/utils/app-error";

type Params = {
    user_id: string | number;
    reauth?: boolean;
    req?: Request;
};

export default async function loginUser({
    user_id,
    reauth,
    req,
}: Params): Promise<Response> {
    try {
        const now = Date.now();

        const target_user_res = await grabUsers({
            query: { user_id },
        });

        const target_user = target_user_res.singleRes;

        if (!target_user?.id) {
            throw new AppError(
                `Couldn't find your account. Please start again.`,
            );
        }

        const target_user_types = (
            await BunSQLite.select<
                BUN_SQLITE_BSQLITE_USER_TYPES,
                (typeof BunSQLiteTables)[number]
            >({
                table: "user_types",
                query: { query: { user_id: { value: target_user.id } } },
            })
        ).payload;

        if (!target_user_types?.[0]) {
            throw new AppError(`No User types found for this user.`);
        }

        if (target_user_types.find((ty) => ty.user_type == "revoked")) {
            throw new AppError(`User access Revoked`);
        }

        let csrf_key = generateCSRF();

        const profile_media = target_user.profile_media_id
            ? (
                  await BunSQLite.select<
                      BUN_SQLITE_BSQLITE_MEDIA,
                      (typeof BunSQLiteTables)[number]
                  >({
                      table: "media",
                      targetId: target_user.profile_media_id,
                  })
              ).singleRes
            : undefined;

        const { media_url, media_thumbnail_url } = profile_media?.id
            ? grabMediaURL({ media: profile_media })
            : {};

        const new_logged_in_user: User = {
            id: target_user.id,
            csrf: csrf_key,
            date: now,
            first_name: target_user.first_name || "",
            last_name: target_user.last_name || "",
            email: target_user.email || "",
            image: media_url,
            image_thumbnail: media_thumbnail_url,
            verification_status: 1,
            logged_in_status: true,
            roles: target_user.user_types || "none",
        };

        const user_payload_json = JSON.stringify(new_logged_in_user);
        const encrypted_key = await encrypt(user_payload_json);

        const res_obj: APIResponseObject = {
            success: true,
            singleRes: new_logged_in_user,
        };

        const res = new Response(JSON.stringify(res_obj), {
            headers: {
                "Content-Type": "application/json",
            },
        });

        const maxAge = AppData["AuthExpiryDays"] * 24 * 60 * 60;

        setCookies(res, [
            {
                name: AppData["AuthKeyCookieName"],
                value: encrypted_key,
                maxAge,
            },
            {
                name: AppData["AuthCSRFCookieName"],
                value: csrf_key,
                maxAge,
            },
        ]);

        await deleteUserSSOCodes({ user_id: new_logged_in_user.id });

        if (!reauth) {
            await logEvent({
                title: "User logged in",
                category: "auth",
                user_id: new_logged_in_user.id,
                plain_text: `User #${new_logged_in_user.id} [${new_logged_in_user.first_name} ${new_logged_in_user.last_name}] logged in successfully.`,
                metadata: {
                    user_id: new_logged_in_user.id,
                    reauth: false,
                },
                ip_address: grabRequestIP(req),
            });
        }

        return res;
    } catch (error: any) {
        await logEvent({
            title: "Login failed",
            category: "auth",
            plain_text: `Login failed for user_id ${user_id}: ${error.message}`,
            metadata: {
                user_id,
            },
            ip_address: grabRequestIP(req),
        });

        throw error;
    }
}
