import path from "node:path";
import { AppData } from "@/src/data/app-data";
import AppError from "@/src/utils/app-error";

/**
 * Where one run may work on a computer, every path absolute inside the
 * computer's workspace (`AppData.ComputerWorkspaceDir`, the only directory
 * mounted from the data volume).
 */
export type ComputerRunDirs = {
    /**
     * The computer's workspace root.
     */
    workspace: string;
    /**
     * Where the run starts and where a relative path lands: the user's
     * folder in the bot's (`bots/<bot>/users/<user>`).
     */
    cwd: string;
    /**
     * The bot's own folder (`bots/<bot>`).
     */
    bot_dir: string;
    /**
     * The workspace's shared folder (`workspaces/<id>`), in a workspace.
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
 * bot's (`bots/<bot>/users/<user>`, where it starts), the bot's own
 * (`bots/<bot>`, for work that is the same for every user) and, in a
 * workspace, the folder its bots share (`workspaces/<id>`).
 */
export default function computerRunDirs({
    bot_id,
    bot_kind,
    user_id,
    workspace_id,
}: Params): ComputerRunDirs {
    const workspace = AppData.ComputerWorkspaceDir;
    const bot_dir = path.posix.join(workspace, "bots", String(Number(bot_id)));
    const cwd = path.posix.join(bot_dir, "users", String(Number(user_id)));
    const shared_dir = Number(workspace_id) > 0
        ? path.posix.join(workspace, "workspaces", String(Number(workspace_id)))
        : null;

    return {
        workspace,
        cwd,
        bot_dir,
        shared_dir,
        roots: bot_kind == "coordinator"
            ? [workspace]
            : [bot_dir, ...(shared_dir ? [shared_dir] : [])],
        user_id: Number(user_id),
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
 * inside `roots`, and another user's folder in a bot's is refused. Throws
 * an `AppError` the bot gets back as the tool's error.
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

    if (!isComputerPathAllowed({ absolute, dirs })) {
        throw new AppError(
            `${absolute} is outside your folders on this computer. Work in ${dirs.cwd} (this user's), ${dirs.roots.join(" or ")} for work every user shares.`,
        );
    }

    return absolute;
}

/**
 * Whether an absolute, normalized path is one the run may touch.
 */
function isComputerPathAllowed({ absolute, dirs }: { absolute: string; dirs: ComputerRunDirs }) {
    if (!dirs.roots.some((root) => isInsideDir({ parent: root, child: absolute }))) return false;

    const relative = path.posix.relative(dirs.workspace, absolute).split("/");

    /**
     * `bots/<bot>/users/<user>/...`: only the run's own user.
     */
    if (relative[0] == "bots" && relative[2] == "users" && relative[3]) {
        return Number(relative[3]) == dirs.user_id && String(dirs.user_id) == relative[3];
    }

    return true;
}

/**
 * A path inside the computer's workspace as a folder ref or the files
 * browser names it: relative to the workspace root, no leading slash.
 */
export function computerWorkspaceRelative({ absolute }: { absolute: string }) {
    return path.posix.relative(AppData.ComputerWorkspaceDir, absolute);
}
