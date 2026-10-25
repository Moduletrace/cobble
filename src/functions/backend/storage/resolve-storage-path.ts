import { existsSync, realpathSync } from "node:fs";
import path from "node:path";
import { AppData } from "@/src/data/app-data";
import AppError from "@/src/utils/app-error";

const empty_folder_text = `Empty Folder`;

type Params = {
    /**
     * The volume's absolute root (`resolveStorageSpec`'s `root`), already
     * checked against the user.
     */
    root: string;
    /**
     * The path a request asked for, relative to that root, e.g.
     * `seo/coderank/raw`. Never absolute, and may be empty for the root
     * itself.
     */
    path?: string | null;
};

export type ResolvedStoragePath = {
    /**
     * The normalized path inside the root, forward slashes, no leading or
     * trailing slash. Empty at the root.
     */
    relative: string;
    /**
     * The absolute path on disk, inside `root`.
     */
    absolute: string;
    /**
     * The folder part of `relative`, empty at the top.
     */
    folder: string;
    /**
     * The last segment, empty at the root.
     */
    name: string;
};

/**
 * Turns a requested path into one safely inside a volume's root: rejects
 * absolute paths, `..`, NUL bytes, anything too long or too deep, and
 * anything a symlink points outside the root. The same rules a bot's own
 * file path gets (`resolveBotPath`), for a root the browser picks rather
 * than a bot's folders.
 *
 * A path that doesn't exist yet is allowed (a folder is made on demand by
 * the bot's tools); a caller that needs an existing file checks it
 * afterwards.
 */
export default function resolveStoragePath({
    root,
    path: requested,
}: Params): ResolvedStoragePath {
    const resolved_root = path.resolve(root);
    const raw = (requested || "").trim().replace(/\\/g, "/");

    if (raw.includes("\0")) {
        throw new AppError(`That path isn't valid.`);
    }

    if (raw.startsWith("/") || /^[a-zA-Z]:/.test(raw)) {
        throw new AppError(
            `Use a path inside the folder, not an absolute one.`,
        );
    }

    const segments = raw
        .split("/")
        .map((segment) => segment.trim())
        .filter(Boolean);

    for (const segment of segments) {
        if (segment == "." || segment == "..") {
            throw new AppError(empty_folder_text);
        }
    }

    if (segments.length > AppData.StorageBrowserMaxDepth) {
        throw new AppError(
            `That path is too deep: at most ${AppData.StorageBrowserMaxDepth} folders.`,
        );
    }

    const relative = segments.join("/");

    if (relative.length > AppData.BotFilePathMaxChars) {
        throw new AppError(`That path is too long.`);
    }

    const absolute = path.join(resolved_root, ...segments);

    if (!isInsideRoot({ root: resolved_root, absolute })) {
        throw new AppError(empty_folder_text);
    }

    guardRealPath({ root: resolved_root, absolute });

    return {
        relative,
        absolute,
        folder: segments.slice(0, -1).join("/"),
        name: segments.at(-1) || "",
    };
}

/**
 * Refuses a path whose existing part resolves outside the root through a
 * symlink (or any other reason).
 */
function guardRealPath({ root, absolute }: { root: string; absolute: string }) {
    const real_root = existsSync(root)
        ? realpathSync(root)
        : path.resolve(root);
    let probe = absolute;

    while (!existsSync(probe)) {
        const parent = path.dirname(probe);

        if (parent == probe) break;

        probe = parent;
    }

    const real_probe = realpathSync(probe);

    if (!isInsideRoot({ root: real_root, absolute: real_probe })) {
        throw new AppError(empty_folder_text);
    }
}

/**
 * Whether a path is inside a root, before it exists.
 */
export function isInsideRoot({
    root,
    absolute,
}: {
    root: string;
    absolute: string;
}) {
    const resolved_root = path.resolve(root);
    const resolved = path.resolve(absolute);

    return (
        resolved == resolved_root ||
        resolved.startsWith(`${resolved_root}${path.sep}`)
    );
}
