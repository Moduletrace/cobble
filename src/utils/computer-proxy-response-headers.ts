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
