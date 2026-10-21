import { existsSync, realpathSync } from "node:fs";
import path from "node:path";
import { AppData } from "@/src/data/app-data";
import AppError from "@/src/utils/app-error";

type Params = {
    /**
     * The directory the file must stay inside (`DATA_DIR/bots/<id>` or
     * `DATA_DIR/workspaces/<id>`), already absolute.
     */
    root: string;
    /**
     * What the bot asked for: a path inside that directory, e.g.
     * `reports/q3.md`. Never absolute.
     */
    path?: string | null;
};

export type ResolvedBotPath = {
    /**
     * The normalized path inside the root, forward slashes, no leading
     * slash: what `bot_files.path` holds.
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
     * The last segment.
     */
    name: string;
};

/**
 * Turns a bot's path into one safely inside its root: rejects absolute
 * paths, `..`, NUL bytes and anything too long or too deep, and, once the
 * path exists, anything a symlink points outside the root. Throws an
 * `AppError` with a message safe to show the user (the bot gets it back
 * as the tool's error).
 */
export default function resolveBotPath({ root, path: requested }: Params): ResolvedBotPath {
    const raw = (requested || "").trim().replace(/\\/g, "/");

    if (raw.includes("\0")) {
        throw new AppError(`That path isn't valid.`);
    }

    if (raw.startsWith("/") || /^[a-zA-Z]:/.test(raw)) {
        throw new AppError(
            `Use a path inside your files folder, not an absolute one (e.g. "reports/q3.md").`,
        );
    }

    const segments = raw.split("/").map((segment) => segment.trim()).filter(Boolean);

    for (const segment of segments) {
        if (segment == "." || segment == "..") {
            throw new AppError(`That path isn't valid: it must stay inside your files folder.`);
        }
    }

    if (segments.length > AppData.BotFilePathMaxDepth) {
        throw new AppError(
            `That path is too deep: at most ${AppData.BotFilePathMaxDepth} folders.`,
        );
    }

    const name = segments.at(-1);

    if (!name) {
        throw new AppError(`Give a file name, e.g. "notes.md".`);
    }

    if (name.length > AppData.BotFileNameMaxChars) {
        throw new AppError(
            `That file name is too long: at most ${AppData.BotFileNameMaxChars} characters.`,
        );
    }

    if (/[<>:"|?*]/.test(name)) {
        throw new AppError(`A file name can't contain < > : " | ? or *.`);
    }

    const relative = segments.join("/");

    if (relative.length > AppData.BotFilePathMaxChars) {
        throw new AppError(`That path is too long.`);
    }

    const absolute = path.join(root, ...segments);
    const inside = path.resolve(absolute);

    if (inside != path.resolve(root) && !inside.startsWith(`${path.resolve(root)}${path.sep}`)) {
        throw new AppError(`That path isn't valid: it must stay inside your files folder.`);
    }

    /**
     * A symlink inside the root must not lead out of it: check the deepest
     * part that exists.
     */
    guardRealPath({ root, absolute: inside });

    return {
        relative,
        absolute: inside,
        folder: segments.slice(0, -1).join("/"),
        name,
    };
}

/**
 * Refuses a path whose existing part resolves outside the root through a
 * symlink (or any other reason).
 */
function guardRealPath({ root, absolute }: { root: string; absolute: string }) {
    const real_root = existsSync(root) ? realpathSync(root) : path.resolve(root);
    let probe = absolute;

    while (!existsSync(probe)) {
        const parent = path.dirname(probe);

        if (parent == probe) break;

        probe = parent;
    }

    const real_probe = realpathSync(probe);

    if (real_probe != real_root && !real_probe.startsWith(`${real_root}${path.sep}`)) {
        throw new AppError(`That path isn't valid: it must stay inside your files folder.`);
    }
}

/**
 * Whether a path is inside a root, before it exists (used for folders).
 */
export function isInsideRoot({ root, absolute }: { root: string; absolute: string }) {
    const resolved_root = path.resolve(root);
    const resolved = path.resolve(absolute);

    return resolved == resolved_root || resolved.startsWith(`${resolved_root}${path.sep}`);
}
