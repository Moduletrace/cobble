import BunSQLite from "@moduletrace/bun-sqlite";
import { existsSync, mkdirSync, renameSync, rmSync, copyFileSync } from "node:fs";
import path from "node:path";
import AppError from "@/src/utils/app-error";
import grabDirNames from "@/src/utils/grab-dir-names";
import resolveBotPath from "@/src/utils/resolve-bot-path";
import type { StorageScope } from "@/src/utils/storage-access";
import { canReachScope } from "@/src/utils/storage-access";
import grabBotFile from "./grab-bot-file";
import grabStorageDir from "./grab-storage-dir";
import { grabBotFileRow } from "./record-bot-file";

type Params = {
    scopes: StorageScope[];
    file_id: number | string;
    /**
     * The new path, in the file's own directory.
     */
    path: string;
};

/**
 * Renames a file or moves it into another folder, inside its own
 * directory. The bytes move on disk and the row follows; an existing file
 * at the target is refused, never overwritten by a rename.
 */
export default async function moveBotFile({ scopes, file_id, path: target }: Params) {
    const file = await grabBotFile({ scopes, file_id });

    if (!file?.id) {
        throw new AppError(`That file isn't in your files.`);
    }

    if (!canReachScope({ scopes, scope: file.scope as any, owner_id: file.owner_id! })) {
        throw new AppError(`That file isn't in your files.`);
    }

    const root = grabStorageDir({ scope: file.scope as any, owner_id: file.owner_id! });
    const resolved = resolveBotPath({ root, path: target });

    if (resolved.relative == file.path) return file;

    const taken = await grabBotFileRow({
        scope: file.scope as any,
        owner_id: file.owner_id!,
        path: resolved.relative,
    });

    if (taken?.id) {
        throw new AppError(`There's already a file at ${resolved.relative}.`);
    }

    const { DATA_DIR } = grabDirNames();
    const from = path.join(root, file.path || "");

    mkdirSync(path.dirname(resolved.absolute), { recursive: true });

    if (existsSync(from)) {
        try {
            renameSync(from, resolved.absolute);
        } catch {
            copyFileSync(from, resolved.absolute);
            rmSync(from, { force: true });
        }
    }

    await BunSQLite.sql({
        sql: `UPDATE bot_files SET path = ?, name = ?, folder = ?, updated_at = ? WHERE id = ?`,
        values: [resolved.relative, resolved.name, resolved.folder, Date.now(), file.id],
    });

    if (file.media_id) {
        const write_path = resolved.absolute.startsWith(DATA_DIR)
            ? resolved.absolute.slice(DATA_DIR.length).replace(/^[\\/]/, "").split("\\").join("/")
            : resolved.relative;

        await BunSQLite.sql({
            sql: `UPDATE media SET media_write_path = ?, updated_at = ? WHERE id = ?`,
            values: [write_path, Date.now(), file.media_id],
        });
    }

    return { ...file, path: resolved.relative, name: resolved.name, folder: resolved.folder };
}
