import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { AgentState } from "./agent-state";
import { AgentConfig } from "./config";
import handleExec from "./handle-exec";
import handleFileDownload from "./handle-file-download";
import handleFileStat from "./handle-file-stat";
import handleFileWrite from "./handle-file-write";
import isAuthorized from "./is-authorized";
import isPortAnswering from "./is-port-answering";
import log from "./log";
import bridgeLoopbackSocket from "./bridge-loopback-socket";
import bridgeVncSocket from "./bridge-vnc-socket";
import proxyLoopback from "./proxy-loopback";
import sendJson from "./send-json";
import serveStaticFile from "./serve-static-file";

/**
 * The agent's one port:
 *
 * - `GET /health` (open): 200 once the browser and its tools answer.
 * - `GET /api/info`, `POST /api/exec`, `GET /api/files/stat|download`,
 *   `POST /api/files/write`: the app's shell and file access.
 * - `/mcp`: Playwright MCP, driving the computer's browser.
 * - `/desktop/` and its `/desktop/websockify` websocket: the screen
 *   (noVNC over Xvnc), Chrome's whole window.
 * - `/terminal/` and its websocket: a shell in the browser (ttyd).
 *
 * Everything but the health check needs the computer's token.
 */
export default function createAgentServer() {
    const server = createServer((req, res) => {
        route({ req, res }).catch((error) => {
            log({ name: "agent", message: `${req.method} ${req.url} failed: ${error?.message || error}` });

            if (!res.headersSent) sendJson({ res, status: 500, body: { error: String(error?.message || error) } });
            else res.destroy();
        });
    });

    server.on("upgrade", (req, socket, head) => {
        const pathname = new URL(req.url || "/", "http://agent").pathname;

        const authorized = isAuthorized({ headers: req.headers, token: AgentConfig.Token });

        if (authorized && pathname == "/desktop/websockify") {
            bridgeVncSocket({ req, socket, head, port: AgentConfig.VncPort });
            return;
        }

        if (authorized && pathname.startsWith("/terminal/")) {
            bridgeLoopbackSocket({ req, socket, head, port: AgentConfig.TerminalPort });
            return;
        }

        socket.end("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
    });

    /**
     * Commands and event streams can run long; the app keeps its own
     * timeouts.
     */
    server.requestTimeout = 0;
    server.headersTimeout = 60_000;

    return server;
}

async function route({ req, res }: { req: IncomingMessage; res: ServerResponse }) {
    const { pathname } = new URL(req.url || "/", "http://agent");

    if (pathname == "/health") {
        const [browser, mcp] = await Promise.all([
            isPortAnswering({ url: `http://127.0.0.1:${AgentConfig.CdpPort}/json/version` }),
            isPortAnswering({ url: `http://127.0.0.1:${AgentConfig.McpPort}/mcp` }),
        ]);

        return sendJson({ res, status: browser && mcp ? 200 : 503, body: { ok: browser && mcp, browser, mcp } });
    }

    if (!isAuthorized({ headers: req.headers, token: AgentConfig.Token })) {
        return sendJson({ res, status: 401, body: { error: "Unauthorized" } });
    }

    if (pathname == "/mcp" || pathname.startsWith("/mcp/")) {
        return proxyLoopback({ req, res, port: AgentConfig.McpPort, unavailable: "The browser tools aren't answering yet." });
    }

    if (pathname == "/terminal") {
        res.writeHead(302, { location: "terminal/" }).end();
        return;
    }

    if (pathname.startsWith("/terminal/")) {
        return proxyLoopback({ req, res, port: AgentConfig.TerminalPort, unavailable: "The shell isn't answering yet." });
    }

    if (pathname == "/" || pathname == "/desktop") {
        res.writeHead(302, { location: "desktop/" }).end();
        return;
    }

    if (pathname == "/desktop/") return serveStaticFile({ res, root: AgentConfig.NoVncDir, name: "vnc.html" });
    if (pathname.startsWith("/desktop/")) {
        return serveStaticFile({ res, root: AgentConfig.NoVncDir, name: pathname.slice("/desktop/".length) });
    }

    if (pathname == "/api/info" && req.method == "GET") {
        return sendJson({
            res,
            body: {
                home_dir: AgentConfig.Home,
                workspace_dir: AgentConfig.WorkspaceDir,
                user: AgentConfig.User,
                browser: {
                    binary: AgentState.browser_binary,
                    version: AgentState.browser_version,
                    sandbox: AgentState.browser_sandbox,
                },
            },
        });
    }

    if (pathname == "/api/exec" && req.method == "POST") return handleExec({ req, res });
    if (pathname == "/api/files/stat" && req.method == "GET") return handleFileStat({ req, res });
    if (pathname == "/api/files/download" && req.method == "GET") return handleFileDownload({ req, res });
    if (pathname == "/api/files/write" && req.method == "POST") return handleFileWrite({ req, res });

    sendJson({ res, status: 404, body: { error: "Not Found" } });
}
