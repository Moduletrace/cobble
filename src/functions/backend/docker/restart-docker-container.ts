import { AppData } from "@/src/data/app-data";
import dockerRequest from "./docker-request";
import waitForHealthyContainer from "./wait-for-healthy-container";

type Params = {
    /**
     * The container's id or name.
     */
    container: string;
    /**
     * Runs between the stop and the start, e.g. to clear what the stopped
     * processes left on a mount.
     */
    whileStopped?: () => Promise<unknown>;
};

/**
 * Stops a container (killed after `AppData.ComputerStopTimeoutSeconds`)
 * and starts the same one again, so everything in it stays. Docker's own
 * `/restart` leaves no gap for `whileStopped`. Resolves once the health
 * check passes, with its state; throws when it doesn't.
 */
export default async function restartDockerContainer({ container, whileStopped }: Params) {
    const path = `/containers/${encodeURIComponent(container)}`;

    const stopped = await dockerRequest({
        method: "POST",
        path: `${path}/stop`,
        query: { t: AppData.ComputerStopTimeoutSeconds },
    });

    if (!stopped.ok && stopped.status != 304) {
        throw new Error(`Couldn't stop the container: ${stopped.message}`);
    }

    await whileStopped?.();

    const started = await dockerRequest({ method: "POST", path: `${path}/start` });

    if (!started.ok && started.status != 304) {
        throw new Error(`Couldn't start the container: ${started.message}`);
    }

    return await waitForHealthyContainer({ container });
}
