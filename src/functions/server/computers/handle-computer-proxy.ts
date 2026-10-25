import type { Server } from "bun";
import computerProxyRequestHeaders from "@/src/utils/computer-proxy-request-headers";
import computerProxyResponseHeaders from "@/src/utils/computer-proxy-response-headers";
import type { WebSocketSession } from "@/src/websocket/types";
import computerProxyTarget from "./computer-proxy-target";
import isSameOriginUpgrade from "@/src/utils/is-same-origin-upgrade";

type Params = {
    req: Request;
    server: Server<WebSocketSession>;
};

/**
 * Serves a computer's own apps (browser, terminal, code) to its owner
 * under `/computers/<id>/`, so the chat can show them in a frame without
 * the sandbox being reachable from the user's browser. Plain requests are
 * fetched and streamed back; websockets are bridged
 * (`computerProxySocket`).
 */
export default async function handleComputerProxy({ req, server }: Params) {
    const resolved = await computerProxyTarget({ req });

    if (resolved.error) return resolved.error;

    const { session, url, prefix, base_url, target } = resolved;
    const headers = computerProxyRequestHeaders({ headers: req.headers, url, prefix });

    if (req.headers.get("upgrade")?.toLowerCase() == "websocket") {
        if (!isSameOriginUpgrade({ req })) return new Response("Forbidden", { status: 403 });

        const protocols = (req.headers.get("sec-websocket-protocol") || "")
            .split(",")
            .map((p) => p.trim())
            .filter(Boolean);

        for (const name of [...headers.keys()]) {
            if (name.startsWith("sec-websocket-")) headers.delete(name);
        }

        const upgraded = server.upgrade(req, {
            headers: protocols[0] ? { "Sec-WebSocket-Protocol": protocols[0] } : undefined,
            data: {
                user: session.user!,
                user_types: session.user_types ?? [],
                proxy: {
                    url: target.replace(/^http/, "ws"),
                    headers: Object.fromEntries(headers.entries()),
                    protocols,
                },
            } satisfies WebSocketSession,
        });

        return upgraded ? undefined : new Response("Upgrade failed", { status: 400 });
    }

    const has_body = req.method != "GET" && req.method != "HEAD";

    const res = await fetch(target, {
        method: req.method,
        headers,
        body: has_body ? req.body : undefined,
        redirect: "manual",
        signal: req.signal,
    }).catch(() => null);

    if (!res) return new Response("This computer isn't answering.", { status: 502 });

    return new Response(res.body, {
        status: res.status,
        statusText: res.statusText,
        headers: computerProxyResponseHeaders({ headers: res.headers, base_url, prefix }),
    });
}
