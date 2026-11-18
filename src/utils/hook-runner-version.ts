import { createHash } from "node:crypto";

type Params = {
    /**
     * The version of the ensure script the app writes (`HookRunnerVersion`):
     * a new script restarts every runner once.
     */
    script_version: string;
    command: string;
    /**
     * The absolute folder it starts in, as resolved by `hookRunnerDir`.
     */
    dir: string;
    computer_id: number;
    workspace_id: number | null;
    /**
     * The envs the runner gets (keys and values): a changed one restarts
     * it, so a rotated secret reaches the process.
     */
    envs: { key: string; value: string }[];
};

/**
 * What a runner was started with, hashed. The app keeps the digest on the
 * hook and the ensure script keeps it beside the process: a different one
 * stops the old runner and starts the new one. Only the digest is stored,
 * never the envs' values.
 */
export default function hookRunnerVersion({
    script_version,
    command,
    dir,
    computer_id,
    workspace_id,
    envs,
}: Params) {
    const resolved = [...envs]
        .map((env) => [env.key, env.value] as [string, string])
        .sort(([left], [right]) => left.localeCompare(right));

    return createHash("sha256")
        .update(
            JSON.stringify({
                script_version,
                command: command.trim(),
                dir,
                computer_id: Number(computer_id),
                workspace_id: workspace_id ? Number(workspace_id) : null,
                envs: resolved,
            }),
        )
        .digest("hex")
        .slice(0, 32);
}