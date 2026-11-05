import type { IncomingMessage } from "node:http";
import { connect } from "node:net";
import type { Duplex } from "node:stream";
import encodeWebsocketFrame from "./encode-websocket-frame";
import readWebsocketFrames from "./read-websocket-frames";
import websocketAccept from "./websocket-accept";

type Params = {
    req: IncomingMessage;
    socket: Duplex;
    head: Buffer;
    /**
     * Xvnc's port, on loopback.
     */
    port: number;
};

/**
 * Carries noVNC's websocket to the screen's VNC server (Xvnc speaks plain
 * TCP), what websockify would do: each frame's payload goes to the VNC
 * server as bytes, and what it sends back goes out as binary frames. Pings
 * are answered, and a close on either side closes both.
 */
export default function bridgeVncSocket({ req, socket, head, port }: Params) {
    const key = req.headers["sec-websocket-key"];

    if (typeof key != "string" || String(req.headers.upgrade || "").toLowerCase() != "websocket") {
        socket.end("HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
        return;
    }

    const protocols = String(req.headers["sec-websocket-protocol"] || "")
        .split(",")
        .map((protocol) => protocol.trim());
    const upstream = connect(port, "127.0.0.1");
    let connected = false;
    let closed = false;

    const close = () => {
        if (closed) return;
        closed = true;
        upstream.destroy();
        socket.destroy();
    };

    const send = (frame: Buffer) => {
        if (!socket.write(frame)) upstream.pause();
    };

    const feed = readWebsocketFrames({
        max_payload: 16 * 1024 * 1024,
        onFrame: ({ opcode, payload }) => {
            if (opcode <= 0x2) {
                if (!upstream.write(payload)) socket.pause();
            } else if (opcode == 0x8) {
                socket.end(encodeWebsocketFrame({ opcode: 0x8, payload: payload.subarray(0, 2) }));
                upstream.end();
            } else if (opcode == 0x9) {
                send(encodeWebsocketFrame({ opcode: 0xa, payload }));
            }
        },
    });

    const read = (chunk: Buffer) => {
        try {
            feed(chunk);
        } catch {
            close();
        }
    };

    upstream.on("connect", () => {
        connected = true;

        socket.write(
            [
                "HTTP/1.1 101 Switching Protocols",
                "Upgrade: websocket",
                "Connection: Upgrade",
                `Sec-WebSocket-Accept: ${websocketAccept({ key })}`,
                ...(protocols.includes("binary") ? ["Sec-WebSocket-Protocol: binary"] : []),
                "",
                "",
            ].join("\r\n"),
        );

        if (head.length) read(head);
        socket.on("data", read);
    });

    upstream.on("data", (chunk: Buffer) => send(encodeWebsocketFrame({ opcode: 0x2, payload: chunk })));
    upstream.on("drain", () => socket.resume());
    socket.on("drain", () => upstream.resume());

    upstream.on("error", () => {
        if (!connected && !closed) {
            closed = true;
            socket.end("HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n");
            return;
        }

        close();
    });

    upstream.on("end", () => {
        if (closed) return;
        closed = true;
        socket.end(encodeWebsocketFrame({ opcode: 0x8, payload: Buffer.from([0x03, 0xe8]) }));
    });

    socket.on("error", close);
    socket.on("close", close);
    // The HTTP server keeps upgraded sockets half open: a viewer that went
    // away without a close frame (a dropped network, a killed tab) only
    // ends its side, and would otherwise hold the bridge and Xvnc's
    // connection (and keep the browser from parking) for good.
    socket.on("end", close);
    upstream.on("close", () => {
        if (!closed) close();
    });
}
