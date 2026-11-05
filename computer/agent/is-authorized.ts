import { timingSafeEqual } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";

/**
 * Whether a request carries the computer's token (`Authorization: Bearer
 * <token>`), compared in constant time. Everything passes when no token is
 * set.
 */
export default function isAuthorized({ headers, token }: { headers: IncomingHttpHeaders; token: string }) {
    if (!token) return true;

    const given = String(headers.authorization || "").replace(/^Bearer\s+/i, "");
    const a = Buffer.from(given);
    const b = Buffer.from(token);

    return a.length == b.length && timingSafeEqual(a, b);
}
