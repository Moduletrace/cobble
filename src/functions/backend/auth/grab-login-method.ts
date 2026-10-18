import parseLoginMethod from "@/src/utils/parse-login-method";

/**
 * Server-side source of truth for the site-wide login method.
 */
export default function grabLoginMethod() {
    return parseLoginMethod({ value: process.env.AUTH_LOGIN_METHOD });
}
