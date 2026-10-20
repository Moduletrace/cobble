type Params = {
    req: Request;
};

/**
 * Whether the browser reached the app over HTTPS: the request's own scheme,
 * or the first `X-Forwarded-Proto` a proxy (Cloudflare, Caddy) set in front.
 * Plain HTTP (a WireGuard address, a LAN IP) gets cookies without `Secure`,
 * which the browser would otherwise drop.
 */
export default function isSecureRequest({ req }: Params): boolean {
    const forwarded = req.headers
        .get("x-forwarded-proto")
        ?.split(",")[0]
        ?.trim()
        .toLowerCase();

    if (forwarded) return forwarded === "https";

    return new URL(req.url).protocol === "https:";
}
