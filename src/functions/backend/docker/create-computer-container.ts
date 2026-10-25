import { AppData } from "@/src/data/app-data";
import dockerRequest from "./docker-request";
import ensureDockerNetwork from "./ensure-docker-network";

import pullDockerImage from "./pull-docker-image";
import removeDockerContainer from "./remove-docker-container";
import resolveHostPath from "./resolve-host-path";
import waitForHealthyContainer from "./wait-for-healthy-container";

/**
 * Docker takes health check durations in nanoseconds.
 */
const seconds = (value: number) => value * 1e9;

type Params = {
    computer_id: number;
    /**
     * The container's name, also its hostname on the network.
     */
    name: string;
    /**
     * The computer's workspace directory as this app sees it.
     */
    data_dir: string;
    /**
     * The computer's browser profile directory as this app sees it.
     */
    browser_dir: string;
    /**
     * CPU cores the container may use.
     */
    cpus: number;
    /**
     * The container's memory limit in MB.
     */
    memory_mb: number;
};

/**
 * Creates and starts (the API's `docker run`) an AIO sandbox container
 * for a computer (`AppData.ComputerImage`), attached to the computers'
 * network (created first when missing), with its home directory
 * bind-mounted from `data_dir` (only its workspace, `AppData.ComputerWorkspaceDir`: the rest of its home lives and dies with the container), its browser profile from
 * `browser_dir` (at `AppData.ComputerBrowserProfileDir`, which Chrome is
 * pointed at, so logins outlive restarts and recreates; the basic password
 * store keeps the cookies' key the same in every container), limited to `cpus` and `memory_mb`, with a
 * health check (`AppData.ComputerHealthcheck`), and restarted with
 * docker. A container left by an earlier try is stopped and replaced.
 * Resolves once the health check passes, with its IP address on the network, which a dev
 * server outside docker reaches it at, since it can't resolve the
 * hostname.
 */
export default async function createComputerContainer({
    computer_id,
    name,
    data_dir,
    browser_dir,
    cpus,
    memory_mb,
}: Params) {
    const network = await ensureDockerNetwork();
    const host_dir = await resolveHostPath({ local_path: data_dir });
    const browser_host_dir = await resolveHostPath({ local_path: browser_dir });

    await pullDockerImage({ image: AppData.ComputerImage });
    await removeDockerContainer({ container: name });

    const created = await dockerRequest<{ Id: string }>({
        method: "POST",
        path: `/containers/create`,
        query: { name },
        body: {
            Image: AppData.ComputerImage,
            Hostname: name,
            Labels: {
                [`${AppData.DockerNetworkName}.computer_id`]: String(computer_id),
            },
            Env: [
                `BROWSER_EXTRA_ARGS=--user-data-dir=${AppData.ComputerBrowserProfileDir} --password-store=basic`,
            ],
            ExposedPorts: { [`${AppData.ComputerPort}/tcp`]: {} },
            Healthcheck: {
                Test: [
                    "CMD-SHELL",
                    `curl -fs -o /dev/null http://localhost:${AppData.ComputerPort}/v1/sandbox && ([ "$DISABLE_BROWSER" = "true" ] || nc -z localhost "$BROWSER_REMOTE_DEBUGGING_PORT") || exit 1`,
                ],
                Interval: seconds(AppData.ComputerHealthcheck.IntervalSeconds),
                Timeout: seconds(AppData.ComputerHealthcheck.TimeoutSeconds),
                StartPeriod: seconds(AppData.ComputerHealthcheck.StartPeriodSeconds),
                Retries: AppData.ComputerHealthcheck.Retries,
            },
            HostConfig: {
                Binds: [
                    `${host_dir}:${AppData.ComputerWorkspaceDir}`,
                    `${browser_host_dir}:${AppData.ComputerBrowserProfileDir}`,
                ],
                NetworkMode: network,
                RestartPolicy: { Name: "unless-stopped" },
                SecurityOpt: ["seccomp=unconfined"],
                ShmSize: AppData.ComputerShmBytes,
                Memory: memory_mb * 1024 * 1024,
                NanoCpus: Math.round(cpus * 1e9),
            },
            NetworkingConfig: {
                EndpointsConfig: { [network]: { Aliases: [name] } },
            },
        },
    });

    if (!created.ok || !created.data?.Id) {
        throw new Error(`Couldn't create the container: ${created.message}`);
    }

    const started = await dockerRequest({
        method: "POST",
        path: `/containers/${created.data.Id}/start`,
    });

    if (!started.ok && started.status != 304) {
        throw new Error(`Couldn't start the container: ${started.message}`);
    }

    const state = await waitForHealthyContainer({ container: created.data.Id });

    return {
        docker_id: created.data.Id,
        network,
        status: state.status,
        host_dir,
        browser_host_dir,
        ip_address: state.ip_address,
    };
}
