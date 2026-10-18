import { randomInt } from "node:crypto";
import { AppData } from "@/src/data/app-data";
import { SiteData } from "@/src/data/site-data";
import sendEmail from "../email/send-email";
import resolveEmailRecipient from "../email/resolve-email-recipient";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { SSOAuth, SSOMethod } from "@/src/types";
import { setCookies } from "@/src/utils/cookies";
import { encrypt } from "@/src/utils/crypt";
import EJSON from "@/src/utils/ejson";
import type {
    APIResponseObject,
    BunextAPIRouteHandlerObjectReturn,
} from "@moduletrace/bunext/types";
import type {
    BUN_SQLITE_BSQLITE_SSO_LOGIN_CODES,
    BunSQLiteTables,
} from "@/db/types/db";

type Params = {
    user_id: number;
    email: string;
    method: SSOMethod;
    /**
     * Carried over on resends so the pending login can't be extended
     * indefinitely. Defaults to now.
     */
    first_step_at?: number;
};

export default async function issueSSOLoginCode({
    user_id,
    email,
    method,
    first_step_at,
}: Params): Promise<BunextAPIRouteHandlerObjectReturn<APIResponseObject>> {
    const sso_code = randomInt(0, 1000000).toString().padStart(6, "0");

    const record_sso = await BunSQLite.insert<
        BUN_SQLITE_BSQLITE_SSO_LOGIN_CODES,
        (typeof BunSQLiteTables)[number]
    >({
        data: [
            {
                code: sso_code,
                user_id,
            },
        ],
        table: "sso_login_codes",
        update_on_duplicate: true,
    });

    if (!record_sso.success) {
        return {
            success: false,
            msg: `Couldn't issue a login code. Please try again.`,
        };
    }

    if (process.env.NODE_ENV != "production") {
        console.log(
            `SSO login code for ${email} (user #${user_id}): ${sso_code}\n` +
                `Code expires in ${AppData["SSOCodeExpiryMinutes"]} minutes.`,
        );
    }

    const is_reset = method == "reset";

    const email_component = (
        <div>
            <div>
                {is_reset
                    ? "Use this code to reset your password"
                    : "Use this Code to Complete your login"}
            </div>
            <h1>{sso_code}</h1>
            <div>
                Code expires in {AppData["SSOCodeExpiryMinutes"]} minutes.
            </div>
        </div>
    );

    const recipient = resolveEmailRecipient({ to: email });

    if (recipient) {
        await sendEmail({
            content: email_component,
            to: recipient,
            subject: is_reset
                ? `Use this code to reset your password.`
                : `Use one-time-code to complete your login.`,
            text: is_reset
                ? `Reset your ${SiteData["SiteName"]} password`
                : `Complete your login to the ${SiteData["SiteName"]} portal`,
            title: `${SiteData["SiteName"]} SSO`,
            options: {
                priority: "high",
            },
        })
            .then((mail_res) => {
                if (!mail_res.success) {
                    console.log(
                        `SSO email to user #${user_id} failed:\n${mail_res.msg}`,
                    );
                }
            })
            .catch((error) => {
                console.log(
                    `SSO email to user #${user_id} errored:\n${error.message}`,
                );
            });
    }

    const sso_auth: SSOAuth = {
        user_id,
        sso_code,
        email,
        method,
        first_step_at: first_step_at || Date.now(),
    };

    const sso_auth_string = EJSON.stringify(sso_auth);
    if (!sso_auth_string) {
        throw new Error(`Couldn't Stringify SSO Auth`);
    }

    const encrypted_sso_auth_string = await encrypt(sso_auth_string);

    return {
        success: true,
        bunext_api_route_res_transform_fn(res: Response) {
            const new_res = res.clone();
            setCookies(new_res, [
                {
                    name: AppData["SSOAuthCookieName"],
                    value: encrypted_sso_auth_string,
                },
            ]);
            return new_res;
        },
    };
}
