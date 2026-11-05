import { AppData } from "@/src/data/app-data";
import computerToken from "@/src/utils/computer-token";
import dockerRequest from "./docker-request";
import ensureDockerNetwork from "./ensure-docker-network";
import grabComputerImage from "./grab-computer-image";

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
    /**
     * Its browser's settings as env (`computerBrowserEnv`).
     */
    browser_env?: string[];
    /**
     * Pull the image again even when docker has it (a rebuild), keeping
     * the local one when the registry can't be reached.
     */
    pull?: boolean;
};

/**
 * Creates and starts (the API's `docker run`) a computer's container
 * (`grabComputerImage`, built from `computer/`), attached to the
 * computers' network (created first when missing), with its workspace
 * bind-mounted from `data_dir` (at `AppData.ComputerWorkspaceDir`: the
 * rest of its home lives and dies with the container) and its browser
 * profile from `browser_dir` (at `AppData.ComputerBrowserProfileDir`, so
 * logins outlive restarts and recreates), limited to `cpus` and
 * `memory_mb`, with a health check (`AppData.ComputerHealthcheck`), and
 * restarted with docker. Its agent asks every request for the computer's
 * token (`computerToken`), and the browser gets its settings
 * (`browser_env`: timezone, languages, screen, flags). A
 * container left by an earlier try is stopped and replaced. Resolves once
 * the health check passes, with its IP address on the network, which a
 * dev server outside docker reaches it at, since it can't resolve the
 * hostname.
 */
export default async function createComputerContainer({
    computer_id,
    name,
    data_dir,
    browser_dir,
    cpus,
    memory_mb,
    browser_env = [],
    pull,
}: Params) {
    const network = await ensureDockerNetwork();
    const host_dir = await resolveHostPath({ local_path: data_dir });
    const browser_host_dir = await resolveHostPath({ local_path: browser_dir });

    const image = await grabComputerImage();

    await pullDockerImage({ image, force: pull });
    await removeDockerContainer({ container: name });

    const created = await dockerRequest<{ Id: string }>({
        method: "POST",
        path: `/containers/create`,
        query: { name },
        body: {
            Image: image,
            Hostname: name,
            Labels: {
                [`${AppData.DockerNetworkName}.computer_id`]: String(computer_id),
            },
            Env: [
                `COBBLE_COMPUTER_TOKEN=${computerToken({ computer_id })}`,
                `COBBLE_BROWSER_PROFILE_DIR=${AppData.ComputerBrowserProfileDir}`,
                ...browser_env,
            ],
            ExposedPorts: { [`${AppData.ComputerPort}/tcp`]: {} },
            Healthcheck: {
                Test: ["CMD-SHELL", `curl -fsS -o /dev/null http://127.0.0.1:${AppData.ComputerPort}/health || exit 1`],
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
                /**
                 * Chrome's own sandbox needs user namespaces, which
                 * docker's default seccomp profile blocks.
                 */
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
        image,
        network,
        status: state.status,
        host_dir,
        browser_host_dir,
        ip_address: state.ip_address,
    };
}
