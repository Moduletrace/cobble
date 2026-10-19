import bunext from "@moduletrace/bunext";
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

const server = Bun.serve({
    async fetch(req, server) {
        try {
            const url = new URL(req.url);

            const pwa_file = await handlePwaFile({ pathname: url.pathname });

            if (pwa_file) return pwa_file;

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
    idleTimeout: development ? 80 : undefined,
});

bunext.bunextLog.info(
    `Server running on http://${server.hostname}:${server.port} ...`,
);

cron();
botsQueue();
liveRelay();