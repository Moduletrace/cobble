import bunext from "@moduletrace/bunext";
import { existsSync } from "fs";
import handleMediaServer from "./functions/server/media/handle-media-server";
import cron from "./cron";
import { websocket } from "./websocket";
import userAuth from "./functions/backend/auth/user-auth";
import type { WebSocketSession } from "./websocket/types";
import { logError, grabRequestIP } from "./functions/backend/logger";
import botsQueue from "./bots-queue";
import liveRelay from "./live-relay";
import enableForeignKeys from "./functions/backend/db/enable-foreign-keys";
import handleComputerProxy from "./functions/server/computers/handle-computer-proxy";
import handlePwaFile from "./functions/server/pwa/handle-pwa-file";
import serveLocalCa from "./functions/server/serve-local-ca";
import startHttpRedirect from "./functions/server/start-http-redirect";
import resolveTlsOptions from "./utils/resolve-tls-options";
import { ComputerProxyPrefix } from "./dict/computer-dict";
import ensureDockerNetwork from "./functions/backend/docker/ensure-docker-network";
import { ensureVapidKeys } from "./push/vapid";

declare global {}

const WEBSOCKET_ENDPOINT = "/ws";

const development = process.env.NODE_ENV == "development";
const port = process.env.PORT || 7227;

await enableForeignKeys();
await bunext.bunextInit();

/**
 * Web Push needs a key pair; the first start of the main install creates
 * it (in the Environment settings) so notifications work without setup.
 */
if (process.env.NODE_ENV != "production" || process.env.MAIN_SERVER) {
    await ensureVapidKeys().catch((error) =>
        logError({ title: "Could not prepare Web Push keys", error }).catch(
            () => {},
        ),
    );
}

/**
 * Computers are docker containers on this network, so the app doesn't
 * start without docker.
 */
try {
    await ensureDockerNetwork();
} catch (error) {
    await logError({ title: "Docker isn't available", error }).catch(() => {});
    console.error(`Can't start without docker: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
}

/**
 * HTTPS when the installer (or a development `.env`) points the server at
 * a certificate. A broken or half-set configuration stops the process
 * rather than quietly serving plain HTTP.
 */
/**
 * In development, a certificate in `certs/` (made by `bun run gen:certs`,
 * or by `bun run dev:phone`) is used without any `.env` entries, so
 * trying the app on a phone over a VPN is one command.
 */
const DevCertFile = "certs/server.crt";
const DevKeyFile = "certs/server.key";
const DevCaFile = "certs/ca.crt";

let cert_file = process.env.TLS_CERT_FILE;
let key_file = process.env.TLS_KEY_FILE;

if (
    process.env.NODE_ENV != "production" &&
    !cert_file &&
    !key_file &&
    existsSync(DevCertFile) &&
    existsSync(DevKeyFile)
) {
    cert_file = DevCertFile;
    key_file = DevKeyFile;

    if (!process.env.TLS_CA_FILE && existsSync(DevCaFile)) {
        process.env.TLS_CA_FILE = DevCaFile;
    }

    bunext.bunextLog.info(`Using the development certificate in certs/`);
}

if (!cert_file && !key_file && process.env.NODE_ENV != "production") {
    bunext.bunextLog.info(
        "Serving plain HTTP (run `bun run dev:phone`, or `bun run gen:certs` then restart, for HTTPS)",
    );
}

let tls: ReturnType<typeof resolveTlsOptions> = undefined;

try {
    tls = resolveTlsOptions({ cert_file, key_file });
} catch (error) {
    console.error(
        `Can't start without a working TLS certificate: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
}

const server = Bun.serve({
    ...(tls ? { tls } : {}),
    async fetch(req, server) {
        try {
            const url = new URL(req.url);

            const pwa_file = await handlePwaFile({ pathname: url.pathname });

            if (pwa_file) return pwa_file;

            const local_ca = await serveLocalCa({ pathname: url.pathname });

            if (local_ca) return local_ca;

            if (url.pathname.startsWith("/media")) {
                try {
                    return await handleMediaServer({ req });
                } catch {
                    return new Response("Not Found", { status: 404 });
                }
            }

            if (url.pathname.startsWith(`${ComputerProxyPrefix}/`)) {
                return await handleComputerProxy({ req, server });
            }

            if (url.pathname === WEBSOCKET_ENDPOINT) {
                const session = await userAuth({ req });

                if (!session.user?.id) {
                    return new Response("Unauthorized", { status: 401 });
                }

                const upgraded = server.upgrade(req, {
                    data: {
                        user: session.user,
                        user_types: session.user_types ?? [],
                    } satisfies WebSocketSession,
                });

                if (!upgraded) {
                    return new Response("Upgrade failed", { status: 400 });
                }

                return;
            }

            return await bunext.bunextRequestHandler({ req, server });
        } catch (error: any) {
            await logError({
                title: "Unhandled request error",
                error,
                metadata: { url: req.url, method: req.method },
                ip_address: grabRequestIP(req),
            }).catch(() => {});

            return Response.json(
                { success: false, msg: "Internal Server Error" },
                { status: 500 },
            );
        }
    },
    websocket,
    development,
    port,
    /**
     * Fail loudly on a second dev server instead of letting Bun's default
     * port sharing split requests between an old and a new process (one
     * might be plain HTTP while the other is HTTPS).
     */
    reusePort: false,
    idleTimeout: development ? 80 : undefined,
});

bunext.bunextLog.info(
    `Server running on ${tls ? "https" : "http"}://${server.hostname}:${server.port} ...`,
);

/**
 * A TLS port cannot answer plain HTTP, so a development `http://` visit
 * is sent to the HTTPS page from the port above it (`startHttpRedirect`).
 */
if (tls && process.env.NODE_ENV != "production") {
    try {
        const redirect = startHttpRedirect({ https_port: port });

        if (redirect) {
            bunext.bunextLog.info(
                `HTTP redirect on port ${redirect.port} (DEV_HTTP_PORT to change it)`,
            );
        }
    } catch (error) {
        bunext.bunextLog.info(
            `Could not start the development HTTP redirect on port ${Number(port) + 1}: ${error instanceof Error ? error.message : String(error)}. Stop the other server or set DEV_HTTP_PORT.`,
        );
    }
}

cron();
botsQueue();
liveRelay();