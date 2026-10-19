import type { ContainerStatus } from "@/src/dict/computer-dict";
import dockerRequest from "./docker-request";

type Params = {
    /**
     * The container's id or name.
     */
    container: string;
};

export type DockerContainerState = {
    id: string;
    status: ContainerStatus;
    /**
     * Host ports published for each container port, e.g. `{ "8080/tcp": "8301" }`.
     */
    ports: Record<string, string>;
};

/**
 * A container's state, or null when docker has no such container.
 */
export default async function inspectDockerContainer({
    container,
}: Params): Promise<DockerContainerState | null> {
    const res = await dockerRequest<{
        Id: string;
        State?: { Status?: ContainerStatus };
        NetworkSettings?: { Ports?: Record<string, { HostPort?: string }[] | null> };
    }>({ path: `/containers/${encodeURIComponent(container)}/json` });

    if (res.status == 404) return null;

    if (!res.ok || !res.data) {
        throw new Error(`Couldn't inspect ${container}: ${res.message}`);
    }

    return {
        id: res.data.Id,
        status: res.data.State?.Status || "unknown",
        ports: Object.fromEntries(
            Object.entries(res.data.NetworkSettings?.Ports || {}).flatMap(([port, bindings]) =>
                bindings?.[0]?.HostPort ? [[port, bindings[0].HostPort]] : [],
            ),
        ),
    };
}
