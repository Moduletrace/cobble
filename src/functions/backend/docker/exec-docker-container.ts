import dockerRequest from "./docker-request";

type Params = {
    /**
     * The container's id or name.
     */
    container: string;
    cmd: string[];
    /**
     * Who runs it, `root` by default.
     */
    user?: string;
    env?: string[];
    timeout_ms?: number;
};

/**
 * Runs a command in a running container (the API's `docker exec`) and
 * waits for it. Resolves with its exit code, or throws when docker
 * couldn't run it.
 */
export default async function execDockerContainer({
    container,
    cmd,
    user = "root",
    env,
    timeout_ms = 30 * 1000,
}: Params) {
    const created = await dockerRequest<{ Id: string }>({
        method: "POST",
        path: `/containers/${container}/exec`,
        body: { Cmd: cmd, User: user, Env: env, AttachStdout: true, AttachStderr: true },
    });

    if (!created.ok || !created.data?.Id) {
        throw new Error(`Couldn't run a command in the container: ${created.message}`);
    }

    const started = await dockerRequest({
        method: "POST",
        path: `/exec/${created.data.Id}/start`,
        body: { Detach: false, Tty: false },
        timeout_ms,
    });

    if (!started.ok) {
        throw new Error(`Couldn't run a command in the container: ${started.message}`);
    }

    const inspected = await dockerRequest<{ ExitCode: number | null }>({
        path: `/exec/${created.data.Id}/json`,
    });

    return { exit_code: inspected.data?.ExitCode ?? null };
}
