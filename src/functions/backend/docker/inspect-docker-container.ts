import { AppData } from "@/src/data/app-data";
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
    /**
     * `State.Status`, with `running` narrowed by the health check
     * (`starting`, `unhealthy`). A container without one is `running`.
     */
    status: ContainerStatus;
    /**
     * Host ports published for each container port, e.g. `{ "8080/tcp": "8301" }`.
     */
    ports: Record<string, string>;
    /**
     * Its IP address on `AppData.DockerNetworkName`, when it's on it and running.
     */
    ip_address: string | null;
};

/**
 * A container's state, or null when docker has no such container.
 */
export default async function inspectDockerContainer({
    container,
}: Params): Promise<DockerContainerState | null> {
    const res = await dockerRequest<{
        Id: string;
        State?: {
            Status?: ContainerStatus;
            Health?: { Status?: "starting" | "healthy" | "unhealthy" | "none" };
        };
        NetworkSettings?: {
            Ports?: Record<string, { HostPort?: string }[] | null>;
            Networks?: Record<string, { IPAddress?: string }>;
        };
    }>({ path: `/containers/${encodeURIComponent(container)}/json` });

    if (res.status == 404) return null;

    if (!res.ok || !res.data) {
        throw new Error(`Couldn't inspect ${container}: ${res.message}`);
    }

    const status = res.data.State?.Status || "unknown";
    const health = res.data.State?.Health?.Status;

    return {
        id: res.data.Id,
        status:
            status == "running" && (health == "starting" || health == "unhealthy")
                ? health
                : status,
        ports: Object.fromEntries(
            Object.entries(res.data.NetworkSettings?.Ports || {}).flatMap(([port, bindings]) =>
                bindings?.[0]?.HostPort ? [[port, bindings[0].HostPort]] : [],
            ),
        ),
        ip_address: res.data.NetworkSettings?.Networks?.[AppData.DockerNetworkName]?.IPAddress || null,
    };
}
