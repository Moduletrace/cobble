type Params = {
    req: Request;
};

/**
 * Whether a websocket upgrade came from a page of the app itself. A
 * websocket handshake isn't bound by CORS, and the session cookies are
 * `SameSite=Lax`, so a page on the same site but another origin (another
 * port on the same machine, a sandbox's exposed port) would otherwise
 * reach `/ws` or a computer's terminal with the user's session.
 *
 * The browser's `Origin` must name the host the request was made to: the
 * `Host` header, or the proxy's `X-Forwarded-Host` when a proxy rewrote
 * it. A client that sends no `Origin` isn't a browser page and carries no
 * ambient cookies of its own, so it is let through to the usual sign-in
 * check.
 */
export default function isSameOriginUpgrade({ req }: Params) {
    const origin = req.headers.get("origin");

    if (!origin) return true;

    let origin_host = "";

    try {
        origin_host = new URL(origin).host.toLowerCase();
    } catch {
        return false;
    }

    if (!origin_host) return false;

    const hosts = [req.headers.get("host"), ...(req.headers.get("x-forwarded-host") || "").split(",")]
        .map((host) => (host || "").trim().toLowerCase())
        .filter(Boolean);

    return hosts.includes(origin_host);
}
