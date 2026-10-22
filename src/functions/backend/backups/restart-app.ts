import dockerRequest from "@/src/functions/backend/docker/docker-request";
import grabAppContainer from "@/src/functions/backend/docker/grab-app-container";

/**
 * How long the process waits before it restarts itself, so the response
 * that "the restore worked" reaches the browser first.
 */
const RESTART_DELAY_MS = 1500;

/**
 * Restarts the app after the data volume was replaced: the open SQLite
 * handle still points at the old file, so the process must come back up
 * on the restored one. In docker the container is restarted through the
 * socket (its `unless-stopped` policy and the entrypoint do the rest);
 * outside docker the process simply exits and is the dev server's to
 * start again.
 */
export default function restartApp() {
    setTimeout(async () => {
        try {
            const container = await grabAppContainer();

            if (container) {
                await dockerRequest({
                    method: "POST",
                    path: `/containers/${encodeURIComponent(container.id)}/restart`,
                });
            }
        } catch {
            // The exit below still brings the container back through its
            // restart policy; a failed API call must not block it.
        }

        process.exit(0);
    }, RESTART_DELAY_MS);
}
