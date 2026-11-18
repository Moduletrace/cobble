import { AppData } from "@/src/data/app-data";
import dockerRequest from "./docker-request";

export type DockerBindMount = {
    /**
     * The path on the host machine, as the docker daemon sees it.
     */
    source: string;
    /**
     * Where it is in the container.
     */
    target: string;
    read_only?: boolean;
    /**
     * Whether docker may make the source when it isn't there. Off for a
     * host directory: a typo would otherwise become a folder docker owns.
     */
    create_mountpoint?: boolean;
};

type Params = {
    image: string;
    cmd?: string[];
    entrypoint?: string[];
    /**
     * `uid:gid`, root by default.
     */
    user?: string;
    mounts?: DockerBindMount[];
    env?: string[];
    /**
     * How long it may run before it is killed, and how long the engine is
     * given to hand its exit code back.
     */
    timeout_ms?: number;
};

/**
 * Runs an image once and waits for it: a throwaway container with no
 * network, its output read back whole and the container removed, whatever
 * happened. Never throws for a container that couldn't run (its `error`
 * says why); throws only when docker itself can't be reached.
 */
export default async function runDockerContainer({
    image,
    cmd,
    entrypoint,
    user,
    mounts = [],
    env,
    timeout_ms = 60 * 1000,
}: Params): Promise<{ exit_code: number | null; logs: string; error: string | null }> {
    const name = `${AppData.ComputerContainerPrefix}-run-${Date.now().toString(36)}`;

    const created = await dockerRequest<{ Id: string }>({
        method: "POST",
        path: `/containers/create`,
        query: { name },
        body: {
            Image: image,
            Cmd: cmd,
            Entrypoint: entrypoint,
            User: user,
            Env: env,
            Tty: true,
            AttachStdout: true,
            AttachStderr: true,
            HostConfig: {
                Mounts: mounts.map((mount) => ({
                    Type: "bind",
                    Source: mount.source,
                    Target: mount.target,
                    ReadOnly: Boolean(mount.read_only),
                    BindOptions: { CreateMountpoint: mount.create_mountpoint !== false },
                })),
                NetworkMode: "none",
                AutoRemove: false,
                Init: true,
            },
        },
    });

    if (!created.ok || !created.data?.Id) {
        return { exit_code: null, logs: "", error: created.message || "Docker couldn't start it." };
    }

    const id = created.data.Id;

    try {
        const started = await dockerRequest({
            method: "POST",
            path: `/containers/${id}/start`,
            timeout_ms,
        });

        if (!started.ok && started.status != 304) {
            return { exit_code: null, logs: "", error: started.message || "Docker couldn't start it." };
        }

        const waited = await dockerRequest<{ StatusCode: number | null; Error?: { Message?: string } | null }>({
            method: "POST",
            path: `/containers/${id}/wait`,
            timeout_ms,
        });

        if (!waited.ok || !waited.data) {
            return { exit_code: null, logs: "", error: waited.message || "It didn't finish in time." };
        }

        const logs = await dockerRequest<string>({
            path: `/containers/${id}/logs`,
            query: { stdout: true, stderr: true, tail: 200 },
        });

        return {
            exit_code: waited.data.StatusCode ?? null,
            logs: typeof logs.data == "string" ? logs.data : "",
            error: waited.data.Error?.Message || null,
        };
    } finally {
        await dockerRequest({
            method: "DELETE",
            path: `/containers/${id}`,
            query: { force: true },
        }).catch(() => {});
    }
}