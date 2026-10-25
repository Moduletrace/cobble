import bunext from "@moduletrace/bunext";
import handleMediaServer from "./functions/server/media/handle-media-server";
import cron from "./cron";
import { websocket } from "./websocket";
import userAuth from "./functions/backend/auth/user-auth";
import type { WebSocketSession } from "./websocket/types";
import { logError, grabRequestIP } from "./functions/backend/logger";
import botsQueue from "./bots-queue";
import fileIngest from "./file-ingest";
import liveRelay from "./live-relay";
import enableForeignKeys from "./functions/backend/db/enable-foreign-keys";
import handleComputerProxy from "./functions/server/computers/handle-computer-proxy";
import handlePwaFile from "./functions/server/pwa/handle-pwa-file";
import handleBuildInfo from "./functions/server/pwa/handle-build-info";
import handlePrecacheGate from "./functions/server/pwa/handle-precache-gate";
import grabPrecacheManifest from "./functions/server/pwa/grab-precache-manifest";
import compressResponse from "./functions/server/compress-response";
import { ComputerProxyPrefix } from "./dict/computer-dict";
import ensureDockerNetwork from "./functions/backend/docker/ensure-docker-network";
import { ensureVapidKeys } from "./push/vapid";
import isSameOriginUpgrade from "./utils/is-same-origin-upgrade";
import { setRequestPeerIP } from "./utils/request-peer-ip";

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
    console.error(
        `Can't start without docker: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
}

/**
 * The app always serves plain HTTP and leaves TLS to whatever sits in
 * front of it (a reverse proxy or tunnel). `isSecureRequest` reads the
 * proxy's `X-Forwarded-Proto` so cookies still get `Secure`.
 */
const server = Bun.serve({
    async fetch(req, server) {
        setRequestPeerIP({ req, ip: server.requestIP(req)?.address });

        try {
            const url = new URL(req.url);

            const pwa_file = await handlePwaFile({ pathname: url.pathname });

            if (pwa_file) return pwa_file;

            const build_info = handleBuildInfo({ pathname: url.pathname });

            if (build_info) return build_info;

            const loading_page = await handlePrecacheGate({ req, url });

            if (loading_page) return loading_page;

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
                if (!isSameOriginUpgrade({ req })) {
                    return new Response("Forbidden", { status: 403 });
                }

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

            return response
                ? await compressResponse({ req, response })
                : response;
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
     * port sharing split requests between an old and a new process.
     */
    reusePort: false,
    idleTimeout: development ? 80 : undefined,
});

bunext.bunextLog.info(
    `Server running on http://${server.hostname}:${server.port} ...`,
);

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
fileIngest().catch((error) =>
    logError({ title: "File ingest couldn't start", error }).catch(() => {}),
);
liveRelay().catch((error) =>
    logError({ title: "Live relay couldn't start", error }).catch(() => {}),
);
