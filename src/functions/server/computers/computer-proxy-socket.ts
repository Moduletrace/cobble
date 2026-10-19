import type { ServerWebSocket } from "bun";
import type { WebSocketSession } from "@/src/websocket/types";

type Socket = ServerWebSocket<WebSocketSession>;

/**
 * Bridges a user's websocket on `/computers/<id>/...` to the same path on
 * the computer (a terminal shell, the browser's CDP, the code editor).
 * Messages sent before the computer's side opens are held, and either
 * side closing closes the other.
 */
export const computerProxySocket = {
    open(ws: Socket) {
        const proxy = ws.data.proxy;

        if (!proxy) return;

        const upstream = new WebSocket(proxy.url, {
            headers: proxy.headers,
            protocols: proxy.protocols,
        } as any);

        upstream.binaryType = "arraybuffer";
        proxy.upstream = upstream;
        proxy.pending = [];

        upstream.onopen = () => {
            for (const message of proxy.pending || []) upstream.send(message as string | Uint8Array<ArrayBuffer>);
            proxy.pending = undefined;
        };

        upstream.onmessage = (event) => {
            ws.send(typeof event.data == "string" ? event.data : new Uint8Array(event.data));
        };

        upstream.onclose = (event) => {
            ws.close(closeCode({ code: event.code }), event.reason);
        };

        upstream.onerror = () => {
            ws.close(1011, "The computer isn't answering");
        };
    },

    message(ws: Socket, message: string | Buffer) {
        const proxy = ws.data.proxy;

        if (!proxy?.upstream) return;

        if (proxy.pending) proxy.pending.push(message);
        else if (proxy.upstream.readyState == WebSocket.OPEN) {
            proxy.upstream.send(message as string | Uint8Array<ArrayBuffer>);
        }
    },

    close(ws: Socket) {
        const upstream = ws.data.proxy?.upstream;

        if (upstream && upstream.readyState < WebSocket.CLOSING) upstream.close();
    },
};

/**
 * Codes a server may not send itself (no status, abnormal) become a
 * normal close.
 */
function closeCode({ code }: { code: number }) {
    return code == 1005 || code == 1006 || code == 1015 ? 1000 : code;
}
