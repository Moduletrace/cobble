import type { LoginMethod } from "@/src/types";

type Params = {
    value?: string | null;
};

/**
 * Reads the site-wide login method (`AUTH_LOGIN_METHOD`). Anything other
 * than `password` falls back to passwordless `code` login, so a typo can
 * never lock out accounts that have no password.
 */
export default function parseLoginMethod({ value }: Params): LoginMethod {
    return value?.trim().toLowerCase() == "password" ? "password" : "code";
}
