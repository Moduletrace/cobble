import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_FILES } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type { StorageScope } from "@/src/utils/storage-access";
import botFilesFilter from "./bot-files-filter";

type Params = {
    scopes: StorageScope[];
    /**
     * Only this folder's files (a folder path), or, with `recursive`,
     * everything under it. Left out, every folder is listed.
     */
    folder?: string | null;
    recursive?: boolean;
    /**
     * Match the name or the path, case-insensitive, in every folder.
     */
    search?: string | null;
    limit?: number;
};

/**
 * The files in the run's directories, newest first: one folder's, or
 * everything under it, optionally matching a name.
 */
export default async function listBotFiles({
    scopes,
    folder,
    recursive,
    search,
    limit = AppData.BotFileListMaxItems,
}: Params): Promise<BUN_SQLITE_COBBLE_BOT_FILES[]> {
    if (!scopes.length) return [];

    const { where, values } = botFilesFilter({ scopes, folder, recursive, search });

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_FILES>({
        sql: `SELECT * FROM bot_files WHERE ${where.join(" AND ")} ORDER BY updated_at DESC, id DESC LIMIT ?`,
        values: [...values, limit],
    });

    return res.payload || [];
}

/**
 * The folders across the run's directories: a file's folder and every
 * parent of it, so an empty folder still shows (folders are the paths
 * that exist).
 */
export async function listBotFolders({
    scopes,
    limit = AppData.BotFileListMaxItems,
}: {
    scopes: StorageScope[];
    limit?: number;
}) {
    const files = await listBotFiles({ scopes, recursive: true, limit: 5000 });
    const folders = new Map<string, { scope: string; owner_id: number; path: string }>();

    for (const file of files) {
        const segments = (file.folder || "").split("/").filter(Boolean);

        for (let i = 1; i <= segments.length; i++) {
            const path = segments.slice(0, i).join("/");
            const key = `${file.scope}:${file.owner_id}:${path}`;

            if (!folders.has(key)) {
                folders.set(key, {
                    scope: String(file.scope),
                    owner_id: Number(file.owner_id),
                    path,
                });
            }
        }

        if (folders.size >= limit) break;
    }

    return [...folders.values()].sort((a, b) => a.path.localeCompare(b.path));
}

