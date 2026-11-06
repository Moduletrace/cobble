import path from "node:path";
import { AppData } from "@/src/data/app-data";
import AppError from "@/src/utils/app-error";
import computerWorkerAccount from "@/src/utils/computer-worker-account";
import computerWorkspacePath from "@/src/utils/computer-workspace-path";

/**
 * Where one run may work on a computer, every path absolute and as the run
 * sees it. Only the computer's workspace (`AppData.ComputerWorkspaceDir`)
 * is mounted from the data volume. A worker sees its folders through its
 * own home: `/home/cb-<bot>/workspace` is a link to `bots/<bot>` in the
 * workspace, and `workspaces/<id>` in it a link to the workspace's shared
 * folder (`computerWorkspacePath` turns either spelling into the real
 * one). The coordinator works in the workspace itself.
 */
export type ComputerRunDirs = {
    /**
     * The computer's workspace root.
     */
    workspace: string;
    /**
     * Where the run starts, its `HOME`, and where a relative path lands:
     * the user's folder in the bot's (`users/<user>`).
     */
    cwd: string;
    /**
     * The bot's own folder: a worker's `/home/cb-<bot>/workspace`, the
     * coordinator's `bots/<bot>` in the workspace.
     */
    bot_dir: string;
    /**
     * The workspace's shared folder, in a workspace: a worker's
     * `workspaces/<id>` inside its own, the coordinator's in the workspace.
     */
    shared_dir: string | null;
    /**
     * The folders the run may touch. The coordinator's is the whole
     * workspace.
     */
    roots: string[];
    /**
     * The user the run is for: another user's folder in a bot's is never
     * the run's, even inside its roots.
     */
    user_id: number;
    /**
     * Whose account the run's commands and files are on the computer: a
     * worker's own (`cb-<bot>`, no sudo, its groups those of the
     * workspace it's in), or null for the coordinator, which works as the
     * computer's user (gem, with sudo). Sent to the agent as `run_as`.
     */
    run_as: ComputerRunAs | null;
};

export type ComputerRunAs = {
    bot_id: number;
    workspace_id: number | null;
};

type Params = {
    bot_id: number | string;
    /**
     * `coordinator`: it reaches every bot's and every workspace's folders,
     * like its files (`grabStorageScopes`).
     */
    bot_kind?: string | null;
    user_id: number | string;
    workspace_id?: number | string | null;
};

/**
 * The folders a run works in on a computer: the user's own inside the
 * bot's (`users/<user>`, where it starts), the bot's own (for work that is
 * the same for every user) and, in a workspace, the folder its bots share.
 * A worker's are under `/home/cb-<bot>/workspace` (its account's home
 * stays in the container, only that folder is kept); the coordinator's
 * are in the computer's workspace (`bots/<bot>`, `workspaces/<id>`).
 */
export default function computerRunDirs({
    bot_id,
    bot_kind,
    user_id,
    workspace_id,
}: Params): ComputerRunDirs {
    const workspace = AppData.ComputerWorkspaceDir;
    const is_coordinator = bot_kind == "coordinator";
    const in_workspace = Number(workspace_id) > 0;
    const bot_dir = is_coordinator
        ? path.posix.join(workspace, "bots", String(Number(bot_id)))
        : computerWorkerAccount({ bot_id }).workspace;
    const cwd = path.posix.join(bot_dir, "users", String(Number(user_id)));
    const shared_dir = in_workspace
        ? path.posix.join(is_coordinator ? workspace : bot_dir, "workspaces", String(Number(workspace_id)))
        : null;

    return {
        workspace,
        cwd,
        bot_dir,
        shared_dir,
        roots: is_coordinator ? [workspace] : [bot_dir, ...(shared_dir ? [shared_dir] : [])],
        user_id: Number(user_id),
        run_as: is_coordinator
            ? null
            : { bot_id: Number(bot_id), workspace_id: in_workspace ? Number(workspace_id) : null },
    };
}

/**
 * Whether `child` is `parent` or inside it (both absolute, normalized).
 */
export function isInsideDir({ parent, child }: { parent: string; child: string }) {
    return child == parent || child.startsWith(`${parent.replace(/\/+$/, "")}/`);
}

/**
 * Turns a path a bot gave a computer tool into the absolute one it means,
 * only when it is one of the run's: a relative path (or `~`, which the
 * run's shells read as its folder) lands in `cwd`, an absolute one must be
 * inside `roots`, and another user's folder in a bot's is refused. Checked
 * on the real path (`computerWorkspacePath`), so a worker may also give
 * one under the computer's workspace (what `pwd -P` or a script's own cwd
 * prints), and returned as the run sees it (`computerRunPath`). Throws an
 * `AppError` the bot gets back as the tool's error.
 */
export function resolveComputerPath({
    path: requested,
    dirs,
}: {
    path?: string | null;
    dirs: ComputerRunDirs;
}) {
    const raw = String(requested ?? "").trim().replace(/\\/g, "/");

    if (raw.includes("\0") || raw.length > AppData.BotFilePathMaxChars * 2) {
        throw new AppError(`That path isn't valid.`);
    }

    const home_relative = raw == "~" ? "" : raw.startsWith("~/") ? raw.slice(2) : null;
    const absolute = path.posix.normalize(
        home_relative != null
            ? path.posix.join(dirs.cwd, home_relative)
            : raw.startsWith("/")
              ? raw
              : path.posix.join(dirs.cwd, raw || "."),
    ).replace(/(.)\/+$/, "$1");

    const real = computerWorkspacePath({ absolute });

    if (!isComputerPathAllowed({ real, dirs })) {
        throw new AppError(
            `${absolute} is outside your folders on this computer. Work in ${dirs.cwd} (this user's), ${dirs.roots.join(" or ")} for work every user shares.`,
        );
    }

    return computerRunPath({ real, dirs });
}

/**
 * A real path on the computer (`computerWorkspacePath`) as the run sees
 * it: for a worker, its folder and the workspace's shared one through its
 * own home (`/home/cb-<bot>/workspace/...`).
 */
export function computerRunPath({ real, dirs }: { real: string; dirs: ComputerRunDirs }) {
    if (!dirs.run_as) return real;

    for (const dir of [dirs.shared_dir, dirs.bot_dir]) {
        if (!dir) continue;

        const dir_real = computerWorkspacePath({ absolute: dir });

        if (isInsideDir({ parent: dir_real, child: real })) {
            return `${dir}${real.slice(dir_real.length)}`;
        }
    }

    return real;
}

/**
 * Whether a real, normalized path is one the run may touch.
 */
function isComputerPathAllowed({ real, dirs }: { real: string; dirs: ComputerRunDirs }) {
    const roots = dirs.roots.map((root) => computerWorkspacePath({ absolute: root }));

    if (!roots.some((root) => isInsideDir({ parent: root, child: real }))) return false;

    const relative = path.posix.relative(dirs.workspace, real).split("/");

    /**
     * `bots/<bot>/users/<user>/...`: only the run's own user.
     */
    if (relative[0] == "bots" && relative[2] == "users" && relative[3]) {
        return Number(relative[3]) == dirs.user_id && String(dirs.user_id) == relative[3];
    }

    return true;
}

/**
 * A path inside the computer's workspace as the files browser names it:
 * relative to the workspace root, no leading slash. A worker's
 * `/home/cb-<bot>/workspace/...` is read as the real path it links to.
 */
export function computerWorkspaceRelative({ absolute }: { absolute: string }) {
    return path.posix.relative(AppData.ComputerWorkspaceDir, computerWorkspacePath({ absolute }));
}
