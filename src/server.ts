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
import handleBuildInfo from "./functions/server/pwa/handle-build-info";
import handlePrecacheGate from "./functions/server/pwa/handle-precache-gate";
import grabPrecacheManifest from "./functions/server/pwa/grab-precache-manifest";
import compressResponse from "./functions/server/compress-response";
import serveLocalCa from "./functions/server/serve-local-ca";
import startHttpRedirect from "./functions/server/start-http-redirect";
import resolveTlsOptions from "./utils/resolve-tls-options";
import pickTlsFiles from "./utils/pick-tls-files";
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
 * The running build's id and files, read once: browsers whose build
 * cookie doesn't match get the loading page first (production only).
 */
const precache = grabPrecacheManifest();

if (precache) {
    bunext.bunextLog.info(
        `Build ${precache.build_id}: ${precache.files.length} files to precache`,
    );
}

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
 * Which certificate to serve with, the same way in every environment: the
 * `TLS_*` variables when set, else `certs/` (which is also where the
 * container's `/app/certs` mount lands). Plain HTTP needs `TLS_DISABLED`.
 */
const picked = pickTlsFiles({
    cert_file: process.env.TLS_CERT_FILE,
    key_file: process.env.TLS_KEY_FILE,
    ca_file: process.env.TLS_CA_FILE,
    disabled: process.env.TLS_DISABLED,
    fallback_cert_file: "certs/server.crt",
    fallback_key_file: "certs/server.key",
    fallback_ca_file: "certs/ca.crt",
    file_exists: existsSync,
});

if (picked.ca_file) process.env.TLS_CA_FILE = picked.ca_file;
else delete process.env.TLS_CA_FILE;

switch (picked.source) {
    case "fallback":
        bunext.bunextLog.info(`Using the certificate in certs/`);
        break;
    case "disabled":
        bunext.bunextLog.info(`Serving plain HTTP (TLS_DISABLED is set)`);
        break;
    case "none":
        bunext.bunextLog.info(
            "Serving plain HTTP (no certificate; run `bun run gen:certs`, or set TLS_CERT_FILE and TLS_KEY_FILE)",
        );
        break;
}

let tls: ReturnType<typeof resolveTlsOptions> = undefined;

try {
    tls = resolveTlsOptions({
        cert_file: picked.cert_file,
        key_file: picked.key_file,
    });
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

            const build_info = handleBuildInfo({ pathname: url.pathname });

            if (build_info) return build_info;

            const loading_page = await handlePrecacheGate({ req, url });

            if (loading_page) return loading_page;

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

            const response = await bunext.bunextRequestHandler({ req, server });

            return response ? await compressResponse({ req, response }) : response;
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
 * A TLS port cannot answer plain HTTP, so a plain `http://` visit is sent
 * to the HTTPS page from the port above it (`startHttpRedirect`). The
 * container publishes only the HTTPS port, so there it is only reachable
 * if that second port is published.
 */
if (tls) {
    try {
        const redirect = startHttpRedirect({ https_port: port });

        if (redirect) {
            bunext.bunextLog.info(
                `HTTP redirect on port ${redirect.port} (HTTP_REDIRECT_PORT to change it)`,
            );
        }
    } catch (error) {
        bunext.bunextLog.info(
            `Could not start the HTTP redirect on port ${Number(port) + 1}: ${error instanceof Error ? error.message : String(error)}. Stop the other server or set HTTP_REDIRECT_PORT.`,
        );
    }
}

/**
 * Background services start after the server is up, and one failing to
 * start never takes the server (or the others) down with it.
 */
try {
    cron();
} catch (error) {
    logError({ title: "Cron couldn't start", error }).catch(() => {});
}

botsQueue().catch((error) =>
    logError({ title: "Bots queue couldn't start", error }).catch(() => {}),
);
liveRelay().catch((error) =>
    logError({ title: "Live relay couldn't start", error }).catch(() => {}),
);
