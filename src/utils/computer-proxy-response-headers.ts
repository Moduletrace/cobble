import { AppData } from "@/src/data/app-data";

type Params = {
    headers: Headers;
    /**
     * The computer's own address, e.g. `http://cobble-computer:8080`.
     */
    base_url: string;
    /**
     * Where the computer is served, e.g. `/computers/3`.
     */
    prefix: string;
};

/**
 * Headers that would stop the chat from showing the computer in a frame,
 * or that no longer fit the body (fetch has already decoded it).
 */
const Dropped = ["x-frame-options", "content-encoding", "content-length", "transfer-encoding", "connection"];

/**
 * The headers a computer's response goes back with: framing allowed, and
 * redirects pointed back under the computer's prefix.
 */
export default function computerProxyResponseHeaders({ headers, base_url, prefix }: Params) {
    const out = new Headers(headers);

    for (const name of Dropped) out.delete(name);

    /**
     * The sandbox is served on the app's own origin, so a cookie it sets
     * would land beside the app's session: each one is kept to the
     * computer's own prefix, and one named like the app's session cookies
     * is dropped.
     */
    out.delete("set-cookie");

    for (const cookie of computerProxyCookies({ cookies: headers.getSetCookie(), prefix })) {
        out.append("set-cookie", cookie);
    }

    const csp = out.get("content-security-policy");

    if (csp?.includes("frame-ancestors")) {
        out.set(
            "content-security-policy",
            csp
                .split(";")
                .filter((d) => !d.trim().startsWith("frame-ancestors"))
                .join(";"),
        );
    }

    const location = out.get("location");

    if (location) {
        const base = base_url.replace(/\/+$/, "");

        if (location.startsWith(base)) {
            out.set("location", `${prefix}${location.slice(base.length) || "/"}`);
        } else if (location.startsWith("/") && !location.startsWith("//") && !location.startsWith(`${prefix}/`)) {
            out.set("location", `${prefix}${location}`);
        }
    }

    return out;
}

/**
 * A computer's `Set-Cookie` values, each limited to `Path=<prefix>` (any
 * `Path` or `Domain` it named removed), without the app's own cookie
 * names.
 */
export function computerProxyCookies({ cookies, prefix }: { cookies: string[]; prefix: string }) {
    const reserved: string[] = [AppData.AuthKeyCookieName, AppData.AuthCSRFCookieName, AppData.BuildCookieName];

    return cookies
        .filter((cookie) => !reserved.includes(cookie.split("=")[0]!.trim()))
        .map((cookie) => {
            const [pair, ...attributes] = cookie.split(";");
            const kept = attributes
                .map((attribute) => attribute.trim())
                .filter((attribute) => attribute && !/^(path|domain)\s*=/i.test(attribute));

            return [pair!.trim(), ...kept, `Path=${prefix}/`].join("; ");
        });
}
