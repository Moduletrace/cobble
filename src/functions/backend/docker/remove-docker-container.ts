import { AppData } from "@/src/data/app-data";
import dockerRequest from "./docker-request";

type Params = {
    /**
     * The container's id or name.
     */
    container: string;
};

/**
 * Stops a container (killed after `AppData.ComputerStopTimeoutSeconds`),
 * then removes it. Its bind-mounted files stay on the host. A container
 * docker doesn't have is already gone.
 */
export default async function removeDockerContainer({ container }: Params) {
    await dockerRequest({
        method: "POST",
        path: `/containers/${encodeURIComponent(container)}/stop`,
        query: { t: AppData.ComputerStopTimeoutSeconds },
    });

    const res = await dockerRequest({
        method: "DELETE",
        path: `/containers/${encodeURIComponent(container)}`,
        query: { force: true },
    });

    if (!res.ok && res.status != 404) {
        throw new Error(`Couldn't remove ${container}: ${res.message}`);
    }
}
