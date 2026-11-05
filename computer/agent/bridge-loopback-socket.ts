import type { IncomingMessage } from "node:http";
import { connect } from "node:net";
import type { Duplex } from "node:stream";

type Params = {
    req: IncomingMessage;
    socket: Duplex;
    head: Buffer;
    /**
     * The loopback port of the service behind this path.
     */
    port: number;
};

/**
 * Joins a websocket upgrade to a service on loopback (the web terminal)
 * byte for byte: its handshake is sent on as it came, path and
 * subprotocol included, with a loopback Host and without the caller's
 * Origin or the app's token; then every frame passes untouched.
 */
export default function bridgeLoopbackSocket({ req, socket, head, port }: Params) {
    const skipped = new Set(["host", "origin", "authorization"]);
    const lines = [`GET ${req.url || "/"} HTTP/1.1`, `Host: 127.0.0.1:${port}`];

    for (let index = 0; index < req.rawHeaders.length; index += 2) {
        const name = req.rawHeaders[index]!;

        if (!skipped.has(name.toLowerCase())) lines.push(`${name}: ${req.rawHeaders[index + 1]}`);
    }

    const upstream = connect(port, "127.0.0.1", () => {
        upstream.write([...lines, "", ""].join("\r\n"));

        if (head.length) upstream.write(head);

        upstream.pipe(socket);
        socket.pipe(upstream);
    });

    const close = () => {
        upstream.destroy();
        socket.destroy();
    };

    upstream.on("error", close);
    socket.on("error", close);
    upstream.on("close", close);
    socket.on("close", close);
}
