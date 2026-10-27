import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOT_FILES } from "@/db/types/db";
import type { StorageScope } from "@/src/utils/storage-access";

type Params = {
    file_id: number | string;
};

/**
 * The directory a bot file is in, unchecked: callers check the user
 * reaches it (`userReachesFileScope`) before showing the file.
 */
export default async function grabBotFileScope({ file_id }: Params): Promise<StorageScope | null> {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_BOT_FILES>({
            sql: `SELECT scope, owner_id FROM bot_files WHERE id = ? LIMIT 1`,
            values: [file_id],
        })
    ).payload?.[0];

    if (!row?.owner_id || (row.scope != "bot" && row.scope != "workspace")) return null;

    return { scope: row.scope, owner_id: Number(row.owner_id) };
}
