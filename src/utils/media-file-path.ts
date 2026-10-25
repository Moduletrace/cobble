import path from "node:path";
import grabDirNames from "./grab-dir-names";
import { isInsideRoot } from "./resolve-bot-path";

type Params = {
    /**
     * A `media` row's `media_write_path` or `media_thumbnail_write_path`,
     * relative to the data directory (e.g. `media/3/abc.png`).
     */
    write_path?: string | null;
    /**
     * The data directory, else `DATA_DIR` (tests pass their own).
     */
    data_dir?: string;
    /**
     * The database directory, else `DB_DIR` (tests pass their own).
     */
    db_dir?: string;
};

/**
 * The absolute path of a media row's file, or null when the row points
 * anywhere it must not: outside the data directory (`../app/.env`, an
 * absolute path) or into the database's own folder. Every read or delete
 * of a media file goes through this, so a row's path can never become a
 * way onto the rest of the disk.
 */
export default function mediaFilePath({ write_path, data_dir, db_dir }: Params): string | null {
    if (!write_path || write_path.includes("\0")) return null;

    const root = path.resolve(data_dir || grabDirNames().DATA_DIR);
    const absolute = path.resolve(root, write_path);

    if (absolute == root || !isInsideRoot({ root, absolute })) return null;

    const database = path.resolve(db_dir || process.env.DB_DIR || path.join(root, "db"));

    if (isInsideRoot({ root: database, absolute })) return null;

    return absolute;
}
