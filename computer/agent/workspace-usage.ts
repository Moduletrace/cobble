import { execFile } from "node:child_process";
import { AgentConfig } from "./config";

/**
 * One folder inside the workspace, with what it holds: `bots/9` is a bot's
 * folder, `workspaces/3` a workspace's shared one.
 */
export type WorkspaceFolderUsage = {
    /**
     * Relative to the workspace root, e.g. `bots/9`.
     */
    path: string;
    bytes: number;
};

/**
 * What the workspace holds, and the biggest folders in it. The whole
 * folder, every bot's and user's included, is what grows on the data
 * volume; the folders are what says whose it is.
 */
export type WorkspaceUsage = {
    bytes: number;
    folders: WorkspaceFolderUsage[];
};

/**
 * When the workspace was last measured, and what it held. A measurement
 * that fails keeps the last one: reporting 0 would let writes through a
 * quota the app can't see (and `du` on a workspace full of small files can
 * outlast its timeout).
 */
let measured: { usage: WorkspaceUsage; at: number } | null = null;

/**
 * Measuring walks the whole workspace, so a run writing several files in a
 * row asks once. The app's quota is its own decision; this is only how
 * much is there.
 */
const CacheMs = 10_000;

/**
 * How many of the biggest folders are named: enough that the one filling
 * the volume is there, few enough to say in a sentence.
 */
const FoldersShown = 5;

/**
 * The workspace's folders whose size is reported: a bot's, a workspace's,
 * and anything else sitting at the top.
 */
const GroupedFolders = ["bots", "workspaces"];

/**
 * What the workspace holds, measured with `du` (which reads the folders in
 * C) and reused for `CacheMs`.
 */
export async function workspaceUsage(): Promise<WorkspaceUsage> {
    if (measured && Date.now() - measured.at < CacheMs) return measured.usage;

    const usage = await measureWorkspace();

    if (!usage) return measured?.usage || { bytes: 0, folders: [] };

    measured = { usage, at: Date.now() };

    return usage;
}

/**
 * The workspace's size and its biggest folders through `du`, or null when
 * it can't be read.
 */
function measureWorkspace() {
    return new Promise<WorkspaceUsage | null>((resolve) => {
        execFile(
            "du",
            ["-B1", "--max-depth=2", "--", AgentConfig.WorkspaceDir],
            { timeout: 30_000, maxBuffer: 16 * 1024 * 1024 },
            (error, stdout) => {
                if (error) return resolve(null);

                resolve(parseDu(String(stdout)));
            },
        );
    });
}

/**
 * `du`'s lines (`<bytes>\t<path>`) as the whole workspace and the folders
 * that make it up: each bot's and each workspace's own, and whatever else
 * sits at the top. A passthrough folder (`bots`, `workspaces`) is only
 * counted through its children.
 */
function parseDu(stdout: string): WorkspaceUsage {
    const root = AgentConfig.WorkspaceDir.replace(/\/+$/, "");
    const deep: WorkspaceFolderUsage[] = [];
    const shallow = new Map<string, number>();
    let bytes = 0;

    for (const line of stdout.split("\n")) {
        const [size, path] = line.split("\t");
        const value = Number(size);

        if (!path || !Number.isFinite(value) || value <= 0) continue;
        if (path == root) {
            bytes = value;
            continue;
        }

        const relative = path.startsWith(`${root}/`) ? path.slice(root.length + 1) : "";
        const [top, second] = relative.split("/");

        if (!top || !GroupedFolders.includes(top)) {
            shallow.set(relative, value);
            continue;
        }

        if (second) deep.push({ path: relative, bytes: value });
        else shallow.set(relative, value);
    }

    const folders = [...deep, ...[...shallow].map(([path, value]) => ({ path, bytes: value }))];

    /**
     * A passthrough folder with children is only counted through them: its
     * own total would show every bot's folder twice.
     */
    const grouped = new Set(deep.map((folder) => folder.path.split("/")[0]));

    return {
        bytes: bytes || folders.reduce((total, folder) => total + folder.bytes, 0),
        folders: folders
            .filter((folder) => !(shallow.has(folder.path) && grouped.has(folder.path)))
            .sort((left, right) => right.bytes - left.bytes)
            .slice(0, FoldersShown),
    };
}