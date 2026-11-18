import { AppData } from "@/src/data/app-data";
import type { HostDirectoryCheck, HostDirectoryCheckAccount } from "@/src/types";
import runDockerContainer from "./run-docker-container";

export type HostDirectoryProbeAccount = {
    bot_id?: number | null;
    /**
     * The bot's name, for the check's own record (a bot can be renamed).
     */
    name: string;
    uid: number;
    gid: number;
    /**
     * Groups a bot works with there, a workspace's (`cw-<id>`) in a
     * workspace.
     */
    group_ids?: number[];
};

type Params = {
    image: string;
    /**
     * The folder on the host machine, as the docker daemon sees it.
     */
    source: string;
    /**
     * Every account that reaches it, each tried on its own.
     */
    accounts: HostDirectoryProbeAccount[];
};

/**
 * The one container reads each account's answer (`uid=readable:writable`,
 * `0` for no), one line each. It runs as root only to hand each test to
 * the account's own ids with `setpriv` (`--groups` replaces root's, so a
 * bot is tried with exactly the groups it works with), so an ACL or a
 * group the user set on the host is what answers.
 */
const ProbeScript = `
target="$1"
shift
for spec in "$@"; do
    uid="\${spec%%:*}"
    rest="\${spec#*:}"
    gid="\${rest%%:*}"
    groups="\${rest#*:}"
    state=$(setpriv --reuid "$uid" --regid "$gid" --groups "$groups" /bin/sh -c 'if [ ! -d "$1" ] || [ ! -r "$1" ]; then echo 0:0; elif [ -w "$1" ]; then echo 1:1; else echo 1:0; fi' sh "$target" 2>/dev/null)
    printf '%s=%s\\n' "$uid" "\${state:-unknown}"
done
`;

/**
 * Checks a folder on the host machine as the accounts a computer's bots
 * work as, in a throwaway container of its image: whether the folder is
 * there, whether each bot can read it and whether it can write in it. It
 * mounts the folder read and write, since a read-only mount answers "no" to
 * every write test, and the script only ever tests, never writes. A check
 * is never made when the folder isn't there (docker would make it as root).
 * This app never runs `chown` or `setfacl` on it: the user gives the folder to
 * these accounts themselves (`hostDirectoryPermissionCommand`), and this
 * is how they find out whether it worked.
 */
export default async function probeHostDirectory({
    image,
    source,
    accounts,
}: Params): Promise<HostDirectoryCheck> {
    const checked_at = Date.now();

    if (!accounts.length) {
        return {
            accounts: [],
            checked_at,
            error: "No bot works on this computer yet, so there is no account to check the folder as.",
        };
    }

    const specs = accounts.map((account) => {
        const groups = account.group_ids?.length ? account.group_ids : [account.gid];

        return `${account.uid}:${account.gid}:${groups.join(",")}`;
    });

    const run = await runDockerContainer({
        image,
        entrypoint: ["/bin/sh", "-c"],
        cmd: [ProbeScript, "sh", "/probe", ...specs],
        mounts: [{ source, target: "/probe", create_mountpoint: false }],
        timeout_ms: AppData.HostDirectoryProbeTimeoutMs,
    });

    const answers = new Map<string, { readable: boolean; writable: boolean }>();

    for (const line of run.logs.split("\n")) {
        const [, uid, readable, writable] = line.trim().match(/^(\d+)=([01]):([01])$/) || [];

        if (uid && readable && writable) {
            answers.set(uid, { readable: readable == "1", writable: writable == "1" });
        }
    }

    const checked: HostDirectoryCheckAccount[] = accounts.map((account) => {
        const answer = answers.get(String(account.uid));

        return {
            bot_id: account.bot_id ?? null,
            name: account.name,
            uid: account.uid,
            readable: Boolean(answer?.readable),
            writable: Boolean(answer?.writable),
        };
    });

    const missing = /does not exist|no such file/i.test(run.error || "");

    if (run.error && !missing) {
        return { accounts: [], checked_at, error: run.error };
    }

    return { accounts: checked, checked_at, error: null };
}