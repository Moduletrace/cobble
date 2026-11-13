import type { ComputerUsageFolder } from "@/src/functions/backend/computers/grab-computer-usage";
import type { ComputerRunDirs } from "@/src/utils/computer-work-dirs";
import formatBytes from "@/src/utils/format-bytes";

type Params = {
    /**
     * The biggest folders in the workspace, most first (`grabComputerUsage`).
     */
    folders?: ComputerUsageFolder[];
    dirs: ComputerRunDirs;
};

export type WorkspaceSpace = {
    /**
     * What the run is told about the folder holding the space, one sentence.
     */
    description: string;
    /**
     * Whether that folder is one the run may clear: its own, the shared one
     * in a workspace, or anything at all for the coordinator. A worker
     * can't touch another bot's folder, so clearing it itself is not an
     * option it should be pointed at.
     */
    clearable: boolean;
};

/**
 * Where a computer's workspace went: its biggest folder, named with whose
 * it is. The workspace is one folder for every bot and user on that
 * computer, so a bot told only "it's full" reported a limit it could never
 * reach from its own folder (a bot's `du` showed 25 MB while the volume
 * held 21.3 GB, most of it another bot's screenshots), which is what this
 * answers.
 */
export default function computerWorkspaceSpace({ folders, dirs }: Params): WorkspaceSpace | null {
    const biggest = folders?.[0];

    if (!biggest) return null;

    const size = formatBytes({ bytes: biggest.bytes });
    const shared = dirs.shared_dir ? dirs.shared_dir.replace(/\/+$/, "").split("/").slice(-2).join("/") : "";

    if (biggest.path == `bots/${dirs.run_as?.bot_id}`) {
        return {
            description: `Most of it is in your own folder (${biggest.path}, ${size}), so clearing it is yours to do.`,
            clearable: true,
        };
    }

    if (shared && biggest.path == shared) {
        return {
            description: `Most of it is in this workspace's shared folder (${biggest.path}, ${size}).`,
            clearable: true,
        };
    }

    if (!dirs.run_as) {
        return {
            description: `Most of it is in ${biggest.path} (${size}), which you can reach as the coordinator, so clearing it is yours to do.`,
            clearable: true,
        };
    }

    const [group] = biggest.path.split("/");
    const owner = group == "workspaces" ? "workspace" : "bot";

    return {
        description: `Most of it is in ${biggest.path} (${size}), another ${owner}'s folder (this computer has one workspace for every bot and user), which you can't clear.`,
        clearable: false,
    };
}