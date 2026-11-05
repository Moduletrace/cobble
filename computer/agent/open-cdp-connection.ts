import { randomBytes } from "node:crypto";
import { request } from "node:http";
import type { Duplex } from "node:stream";
import encodeWebsocketFrame from "./encode-websocket-frame";
import readWebsocketFrames from "./read-websocket-frames";

type Params = {
    /**
     * Chrome's DevTools port, on loopback.
     */
    port: number;
    /**
     * How long connecting, and each command, may take.
     */
    timeout_ms: number;
};

export type CdpConnection = {
    /**
     * Runs one DevTools command (on a page's session when `session_id` is
     * given) and resolves with its result; rejects with Chrome's error.
     */
    send: (params: { method: string; params?: Record<string, unknown>; session_id?: string }) => Promise<any>;
    close: () => void;
};

type Pending = {
    resolve: (result: any) => void;
    reject: (error: Error) => void;
    timer: NodeJS.Timeout;
};

/**
 * The agent's own DevTools client: one websocket to the browser's
 * endpoint (`/json/version`), commands matched to their answers by id,
 * events ignored. The image's Node has no WebSocket of its own, so the
 * frames are the agent's (masked, as a client's must be).
 */
export default async function openCdpConnection({ port, timeout_ms }: Params): Promise<CdpConnection> {
    const version = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(timeout_ms) });
    const { webSocketDebuggerUrl } = (await version.json()) as { webSocketDebuggerUrl?: string };

    if (!webSocketDebuggerUrl) throw new Error("The browser named no DevTools endpoint.");

    const socket = await upgrade({ url: webSocketDebuggerUrl, timeout_ms });
    const pending = new Map<number, Pending>();
    let next_id = 0;
    let closed = false;
    let fragments: Buffer[] = [];

    const close = () => {
        if (closed) return;
        closed = true;

        for (const { reject, timer } of pending.values()) {
            clearTimeout(timer);
            reject(new Error("The DevTools connection closed."));
        }

        pending.clear();
        socket.destroy();
    };

    const write = ({ opcode, payload }: { opcode: number; payload: Buffer }) => {
        socket.write(encodeWebsocketFrame({ opcode, payload, mask: randomBytes(4) }));
    };

    const onMessage = (text: string) => {
        let message: { id?: number; result?: unknown; error?: { message?: string } };

        try {
            message = JSON.parse(text);
        } catch {
            return;
        }

        const waiting = message.id == undefined ? undefined : pending.get(message.id);

        if (!waiting) return;

        pending.delete(message.id!);
        clearTimeout(waiting.timer);

        if (message.error) waiting.reject(new Error(message.error.message || "DevTools refused the command."));
        else waiting.resolve(message.result);
    };

    const feed = readWebsocketFrames({
        from: "server",
        max_payload: 64 * 1024 * 1024,
        onFrame: ({ fin, opcode, payload }) => {
            if (opcode == 0x1 || opcode == 0x0) {
                fragments.push(payload);

                if (!fin) return;

                const whole = Buffer.concat(fragments);

                fragments = [];
                onMessage(whole.toString("utf8"));
            } else if (opcode == 0x8) {
                close();
            } else if (opcode == 0x9) {
                write({ opcode: 0xa, payload });
            }
        },
    });

    socket.on("data", (chunk: Buffer) => {
        try {
            feed(chunk);
        } catch {
            close();
        }
    });
    socket.on("error", close);
    socket.on("close", close);

    return {
        close,
        send: ({ method, params = {}, session_id }) => {
            if (closed) return Promise.reject(new Error("The DevTools connection closed."));

            const id = ++next_id;

            return new Promise((resolve, reject) => {
                const timer = setTimeout(() => {
                    pending.delete(id);
                    reject(new Error(`${method} took too long.`));
                }, timeout_ms);

                pending.set(id, { resolve, reject, timer });
                write({
                    opcode: 0x1,
                    payload: Buffer.from(JSON.stringify({ id, method, params, ...(session_id ? { sessionId: session_id } : {}) })),
                });
            });
        },
    };
}

/**
 * The websocket handshake to a `ws://` URL on loopback, resolving with
 * the upgraded socket.
 */
function upgrade({ url, timeout_ms }: { url: string; timeout_ms: number }) {
    const target = new URL(url);

    return new Promise<Duplex>((resolve, reject) => {
        const req = request({
            host: target.hostname,
            port: target.port,
            path: target.pathname,
            headers: {
                Connection: "Upgrade",
                Upgrade: "websocket",
                "Sec-WebSocket-Version": "13",
                "Sec-WebSocket-Key": randomBytes(16).toString("base64"),
            },
            timeout: timeout_ms,
        });

        req.on("upgrade", (_res, socket, head) => {
            if (head.length) socket.unshift(head);
            resolve(socket);
        });
        req.on("response", (res) => {
            res.resume();
            reject(new Error(`DevTools answered ${res.statusCode} instead of a websocket.`));
        });
        req.on("timeout", () => req.destroy(new Error("DevTools didn't answer.")));
        req.on("error", reject);
        req.end();
    });
}
