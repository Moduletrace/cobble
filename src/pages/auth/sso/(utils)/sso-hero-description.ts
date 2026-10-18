import { AppData } from "@/src/data/app-data";
import type { SSOPendingLogin } from "@/src/types";

type Params = {
    pending?: SSOPendingLogin;
};

/**
 * The code-only wording reads the same whether or not the account exists,
 * matching the no-enumeration response of `get-login-code`. A password
 * login only gets here once the password was correct.
 */
export default function ssoHeroDescription({ pending }: Params) {
    const expiry = `It expires in ${AppData["SSOCodeExpiryMinutes"]} minutes.`;

    if (pending?.method == "password") {
        return `We've emailed a 6-digit code to the address on your account. ${expiry}`;
    }

    if (pending?.identifier) {
        return `If ${pending.identifier} matches an account, we've emailed it a 6-digit login code. ${expiry}`;
    }

    return `Enter the 6-digit code we emailed you. ${expiry}`;
}
