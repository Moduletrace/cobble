import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_FILES } from "@/db/types/db";
import { rmSync } from "node:fs";
import path from "node:path";
import AppError from "@/src/utils/app-error";
import grabDirNames from "@/src/utils/grab-dir-names";
import type { StorageScope } from "@/src/utils/storage-access";
import grabBotFile from "./grab-bot-file";
import grabStorageDir from "./grab-storage-dir";

type Params = {
    scopes: StorageScope[];
    file_id: number | string;
};

/**
 * Deletes a bot file: the catalog row (its chunks go with it), its bytes
 * and its `media` row. Refuses anything outside the run's directories.
 */
export default async function deleteBotFile({ scopes, file_id }: Params) {
    const file = await grabBotFile({ scopes, file_id });

    if (!file?.id) {
        throw new AppError(`That file isn't in your files.`);
    }

    const { DATA_DIR } = grabDirNames();
    const root = grabStorageDir({ scope: file.scope as any, owner_id: file.owner_id! });
    const absolute = path.join(root, file.path || "");

    if (absolute.startsWith(path.resolve(root))) {
        rmSync(absolute, { force: true });
    }

    await BunSQLite.sql({ sql: `DELETE FROM bot_file_vectors WHERE file_id = ?`, values: [file.id] });
    await BunSQLite.sql({ sql: `DELETE FROM bot_files WHERE id = ?`, values: [file.id] });
    /**
     * Its pending ingestion would only find nothing left.
     */
    await BunSQLite.sql({
        sql: `DELETE FROM file_ingest_queue WHERE file_id = ? AND status IN ('pending', 'processing')`,
        values: [file.id],
    }).catch(() => {});

    if (file.media_id) {
        const media = await BunSQLite.sql<{ media_write_path?: string; media_thumbnail_write_path?: string }>({
            sql: `SELECT media_write_path, media_thumbnail_write_path FROM media WHERE id = ? LIMIT 1`,
            values: [file.media_id],
        }).then((res) => res.payload?.[0]);

        if (media?.media_write_path) {
            rmSync(path.join(DATA_DIR, media.media_write_path), { force: true });
        }

        if (media?.media_thumbnail_write_path) {
            rmSync(path.join(DATA_DIR, media.media_thumbnail_write_path), { force: true });
        }

        await BunSQLite.sql({ sql: `DELETE FROM media_paradigms WHERE media_id = ?`, values: [file.media_id] });
        await BunSQLite.sql({ sql: `DELETE FROM media WHERE id = ?`, values: [file.media_id] });
    }

    return file as BUN_SQLITE_COBBLE_BOT_FILES;
}
