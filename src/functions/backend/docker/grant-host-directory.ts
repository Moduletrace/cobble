import { AppData } from "@/src/data/app-data";
import hostDirectoryGrantArgs, {
    HostDirectoryGrantScript,
} from "@/src/utils/host-directory-grant-args";
import runDockerContainer from "./run-docker-container";

type Params = {
    image: string;
    source: string;
    added?: number[];
    removed?: number[];
};

/**
 * Gives the bot accounts access to a host folder, and takes it from the ones
 * that no longer see it, from inside a throwaway container running as root:
 * ACL entries only (`hostDirectoryGrantArgs` has the script), so the folder
 * keeps its owner and its mode. Returns why it could not, or null.
 */
export default async function grantHostDirectory({
    image,
    source,
    added = [],
    removed = [],
}: Params): Promise<{ error: string | null }> {
    const entries = hostDirectoryGrantArgs({ added, removed });

    if (!entries.length) return { error: null };

    const run = await runDockerContainer({
        image,
        entrypoint: ["/bin/sh", "-c"],
        cmd: [HostDirectoryGrantScript, "sh", "/folder", ...entries],
        mounts: [{ source, target: "/folder", create_mountpoint: false }],
        timeout_ms: AppData.HostDirectoryGrantTimeoutMs,
    });

    if (run.exit_code == 0) return { error: null };

    return {
        error:
            run.error ||
            run.logs.trim() ||
            "The container couldn't change the folder's permissions.",
    };
}