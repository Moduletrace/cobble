import dockerRequest from "./docker-request";

type Params = {
    /**
     * The container's id or name.
     */
    container: string;
};

/**
 * Stops and removes a container. Its bind-mounted files stay on the host.
 * A container docker doesn't have is already gone.
 */
export default async function removeDockerContainer({ container }: Params) {
    const res = await dockerRequest({
        method: "DELETE",
        path: `/containers/${encodeURIComponent(container)}`,
        query: { force: true },
    });

    if (!res.ok && res.status != 404) {
        throw new Error(`Couldn't remove ${container}: ${res.message}`);
    }
}
