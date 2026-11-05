import { request, type IncomingMessage, type ServerResponse } from "node:http";
import sendJson from "./send-json";

type Params = {
    req: IncomingMessage;
    res: ServerResponse;
    /**
     * The loopback port of the service behind this path.
     */
    port: number;
    /**
     * Said when it doesn't answer.
     */
    unavailable: string;
};

/**
 * Streams a request to a service on loopback (Playwright MCP, the web
 * terminal) and its answer back, event streams included, as if it came
 * from there: their host checks only let loopback hosts in, and the
 * app's token stays here.
 */
export default function proxyLoopback({ req, res, port, unavailable }: Params) {
    const headers = { ...req.headers, host: `127.0.0.1:${port}` };

    delete headers.authorization;
    delete headers.origin;

    const upstream = request({ host: "127.0.0.1", port, method: req.method, path: req.url, headers }, (answer) => {
        res.writeHead(answer.statusCode || 502, answer.headers);
        answer.pipe(res);
    });

    upstream.on("error", () => {
        if (!res.headersSent) sendJson({ res, status: 502, body: { error: unavailable } });
        else res.destroy();
    });

    res.on("close", () => upstream.destroy());
    req.pipe(upstream);
}
