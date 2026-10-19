import { AppData } from "@/src/data/app-data";

type Params = {
    headers: Headers;
    /**
     * The request's own address, as the user's browser sees it.
     */
    url: URL;
    /**
     * Where the computer is served, e.g. `/computers/3`.
     */
    prefix: string;
};

/**
 * Headers hop-by-hop or tied to the app's own connection, never sent on.
 */
const Dropped = ["host", "connection", "keep-alive", "upgrade", "content-length", "transfer-encoding"];

/**
 * The headers a request is sent to a computer with: the user's own,
 * without the app's session cookies, plus the forwarded host, protocol
 * and prefix, which the sandbox builds its links (and its browser's CDP
 * address) from.
 */
export default function computerProxyRequestHeaders({ headers, url, prefix }: Params) {
    const out = new Headers(headers);

    for (const name of Dropped) out.delete(name);

    const cookies = (headers.get("cookie") || "")
        .split(";")
        .map((c) => c.trim())
        .filter(Boolean)
        .filter((c) => {
            const name = c.split("=")[0];

            return name != AppData.AuthKeyCookieName && name != AppData.AuthCSRFCookieName;
        });

    if (cookies.length) out.set("cookie", cookies.join("; "));
    else out.delete("cookie");

    out.set("x-forwarded-host", headers.get("x-forwarded-host") || url.host);
    out.set("x-forwarded-proto", headers.get("x-forwarded-proto") || url.protocol.replace(":", ""));
    out.set("x-forwarded-prefix", prefix);

    return out;
}
