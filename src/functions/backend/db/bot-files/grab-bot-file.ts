import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_BOT_FILES,
    BUN_SQLITE_COBBLE_MEDIA,
} from "@/db/types/db";
import mediaColumns from "@/src/functions/backend/db/media/media-columns";
import { canReachScope, type StorageScope } from "@/src/utils/storage-access";

type Params = {
    /**
     * The directories the run may touch (`grabStorageScopes`).
     */
    scopes: StorageScope[];
    /**
     * The catalog row's id.
     */
    file_id?: number | string | null;
    /**
     * Or its path, with the directory it's in.
     */
    scope?: string | null;
    owner_id?: number | string | null;
    path?: string | null;
};

export type BotFileWithMedia = BUN_SQLITE_COBBLE_BOT_FILES & {
    media?: BUN_SQLITE_COBBLE_MEDIA | null;
};

/**
 * One bot file, only if it's in one of the run's directories, with its
 * `media` row when that still exists.
 */
export default async function grabBotFile({
    scopes,
    file_id,
    scope,
    owner_id,
    path,
}: Params): Promise<BotFileWithMedia | null> {
    if (!file_id && !(scope && owner_id != null && path)) return null;

    const res = file_id
        ? await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_FILES>({
              sql: `SELECT * FROM bot_files WHERE id = ? LIMIT 1`,
              values: [file_id],
          })
        : await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_FILES>({
              sql: `SELECT * FROM bot_files WHERE scope = ? AND owner_id = ? AND path = ? LIMIT 1`,
              values: [String(scope), Number(owner_id), String(path)],
          });

    const file = res.payload?.[0];

    if (!file?.id) return null;

    if (!canReachScope({ scopes, scope: file.scope as any, owner_id: file.owner_id! })) {
        return null;
    }

    const media = file.media_id
        ? await BunSQLite.sql<BUN_SQLITE_COBBLE_MEDIA>({
              sql: `SELECT ${mediaColumns({ alias: "m" })} FROM media m WHERE m.id = ? LIMIT 1`,
              values: [file.media_id],
          }).then((r) => r.payload?.[0] || null)
        : null;

    return { ...file, media };
}
