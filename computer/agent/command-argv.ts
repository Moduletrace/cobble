/**
 * The program and arguments that run one `bash -c` command: as the
 * agent's own uid/gid, or through `setpriv` as another account with its
 * groups (`--init-groups`; Node's own `uid`/`gid` would drop them, and a
 * worker's workspace groups with them).
 */
export default function commandArgv({ command, as }: { command: string; as?: { uid: number; gid: number } }) {
    if (!as) return { file: "bash", args: ["-c", command] };

    return {
        file: "setpriv",
        args: ["--reuid", String(as.uid), "--regid", String(as.gid), "--init-groups", "--", "bash", "-c", command],
    };
}
