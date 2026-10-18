/**
 * Extracts a specific cookie value from a Request's Cookie header.
 * Returns undefined if the cookie is not found.
 */
export function getCookie(request: Request, name: string): string | undefined {
    const header = request.headers.get("Cookie");
    if (!header) return undefined;

    const cookies = header.split(";");

    for (const cookie of cookies) {
        const [key, ...rest] = cookie.split("=");
        if (!key) continue;
        if (key.trim() === name) {
            return rest.join("=").trim();
        }
    }

    return undefined;
}

export type CookieOptions = {
    /** Cookie name */
    name: string;
    /** Cookie value */
    value: string;
    /** Prevents client-side JS access (default: true) */
    httpOnly?: boolean;
    /** Only send over HTTPS (default: true) */
    secure?: boolean;
    /** CSRF protection strategy (default: "Lax") */
    sameSite?: "Strict" | "Lax" | "None";
    /** URL path scope (default: "/") */
    path?: string;
    /** Lifetime in seconds. Omit for a session cookie. */
    maxAge?: number;
    /** Restrict to a specific domain */
    domain?: string;
};

/**
 * Appends one or more Set-Cookie headers to a Response.
 * Uses `append` so multiple cookies don't overwrite each other.
 */
export function setCookies(response: Response, cookies: CookieOptions[]): void {
    for (const cookie of cookies) {
        const {
            name,
            value,
            httpOnly = true,
            secure = true,
            sameSite = "Lax",
            path = "/",
            maxAge,
            domain,
        } = cookie;

        let header = `${name}=${value}; Path=${path}; SameSite=${sameSite}`;

        if (httpOnly) header += "; HttpOnly";
        if (secure) header += "; Secure";
        if (maxAge !== undefined) header += `; Max-Age=${maxAge}`;
        if (domain) header += `; Domain=${domain}`;

        response.headers.append("Set-Cookie", header);
    }
}

/**
 * Appends a Set-Cookie header that expires the named cookie immediately.
 * Sets Max-Age=0 and an empty value to instruct the browser to remove it.
 * Path and domain must match the original cookie for deletion to work.
 */
export function deleteCookies(
    response: Response,
    cookies: Pick<CookieOptions, "name" | "path" | "domain" | "httpOnly">[],
): void {
    for (const { name, path = "/", domain, httpOnly } of cookies) {
        let header = `${name}=; Path=${path}; Max-Age=0`;

        if (httpOnly) header += "; HttpOnly";
        if (domain) header += `; Domain=${domain}`;

        response.headers.append("Set-Cookie", header);
    }
}
