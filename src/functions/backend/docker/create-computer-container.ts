import { AppData } from "@/src/data/app-data";
import { ComputerMcpPath } from "@/src/dict/computer-dict";
import dockerRequest from "./docker-request";
import ensureDockerNetwork from "./ensure-docker-network";
import grabAppContainer from "./grab-app-container";
import grabFreePort from "./grab-free-port";
import inspectDockerContainer from "./inspect-docker-container";
import pullDockerImage from "./pull-docker-image";
import removeDockerContainer from "./remove-docker-container";
import resolveHostPath from "./resolve-host-path";

type Params = {
    computer_id: number;
    /**
     * The container's name, also its hostname on the network.
     */
    name: string;
    /**
     * The computer's home directory as this app sees it.
     */
    data_dir: string;
};

/**
 * Creates and starts an AIO sandbox container for a computer
 * (`AppData.ComputerImage`) on the computers' network, with its home
 * directory bind-mounted from `data_dir` and restarted with docker. A
 * container left by an earlier try is replaced. When the app runs outside
 * docker, the sandbox is also published on a localhost port, returned as
 * `mcp_url`'s host.
 */
export default async function createComputerContainer({ computer_id, name, data_dir }: Params) {
    const network = await ensureDockerNetwork();
    const in_docker = Boolean(await grabAppContainer());
    const host_dir = await resolveHostPath({ local_path: data_dir });
    const port_key = `${AppData.ComputerPort}/tcp`;
    const host_port = in_docker ? undefined : grabFreePort();

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
            ExposedPorts: { [port_key]: {} },
            HostConfig: {
                Binds: [`${host_dir}:${AppData.ComputerHomeDir}`],
                NetworkMode: network,
                RestartPolicy: { Name: "unless-stopped" },
                SecurityOpt: ["seccomp=unconfined"],
                ShmSize: AppData.ComputerShmBytes,
                Memory: AppData.ComputerMemoryBytes,
                NanoCpus: AppData.ComputerCpus * 1e9,
                PortBindings: host_port
                    ? { [port_key]: [{ HostIp: "127.0.0.1", HostPort: String(host_port) }] }
                    : undefined,
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

    const state = await inspectDockerContainer({ container: created.data.Id });

    return {
        docker_id: created.data.Id,
        network,
        status: state?.status || "unknown",
        host_dir,
        mcp_url: host_port ? `http://127.0.0.1:${host_port}${ComputerMcpPath}` : undefined,
    };
}
