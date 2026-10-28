import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_FILES } from "@/db/types/db";
import { rmSync } from "node:fs";
import path from "node:path";
import type { BotFileScope } from "@/src/dict/bot-file-dict";
import grabDirNames from "@/src/utils/grab-dir-names";
import { logError } from "@/src/functions/backend/logger";
import grabStorageDir from "./grab-storage-dir";

type Params = {
    scope: BotFileScope;
    owner_id: number | string;
    /**
     * Its files' `media` ids, read before the rows go. Left out, they are
     * read here (only useful when the catalog rows still exist).
     */
    media_ids?: number[];
};

/**
 * The `media` ids of a directory's files, read before the bot or workspace
 * (and with it, the catalog rows) is deleted.
 */
export async function grabStorageMediaIds({ scope, owner_id }: { scope: BotFileScope; owner_id: number | string }) {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_FILES>({
        sql: `SELECT media_id FROM bot_files WHERE scope = ? AND owner_id = ?`,
        values: [scope, owner_id],
    });

    return (res.payload || []).map((file) => Number(file.media_id)).filter((id) => id > 0);
}

/**
 * Removes a directory's files for good when the bot or workspace it
 * belongs to goes: the disk folder, every file's `media` row, and what is
 * left of the catalog. A failure is logged, never thrown: deleting the
 * bot must not stop on a stray file.
 */
export default async function purgeStorage({ scope, owner_id, media_ids }: Params) {
    try {
        const ids = media_ids || (await grabStorageMediaIds({ scope, owner_id }));

        if (ids.length) {
            const placeholders = ids.map(() => "?").join(", ");

            await BunSQLite.sql({
                sql: `DELETE FROM media_paradigms WHERE media_id IN (${placeholders})`,
                values: ids,
            }).catch(() => {});

            await BunSQLite.sql({
                sql: `DELETE FROM media WHERE id IN (${placeholders})`,
                values: ids,
            }).catch(() => {});
        }

        /**
         * Usually gone already, with the bot or workspace (the cascade).
         */
        await BunSQLite.sql({
            sql: `DELETE FROM bot_files WHERE scope = ? AND owner_id = ?`,
            values: [scope, owner_id],
        });

        const dir = grabStorageDir({ scope, owner_id, create: false });
        const { DATA_DIR } = grabDirNames();

        /**
         * Never outside the data volume, whatever the path says.
         */
        if (path.resolve(dir).startsWith(path.resolve(DATA_DIR))) {
            rmSync(dir, { recursive: true, force: true });
        }
    } catch (error) {
        await logError({
            title: `${scope} ${owner_id}'s files couldn't be cleaned up`,
            error,
            metadata: { scope, owner_id },
        }).catch(() => {});
    }
}
