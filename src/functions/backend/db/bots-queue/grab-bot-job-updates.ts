import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS_QUEUE_UPDATES } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";

type Params = {
    task_id: number | string;
};

/**
 * The latest steps of the newest job working on a task, oldest first,
 * capped at `AppData.BotJobUpdatesShown`.
 */
export default async function grabBotJobUpdates({
    task_id,
}: Params): Promise<BUN_SQLITE_COBBLE_BOTS_QUEUE_UPDATES[]> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS_QUEUE_UPDATES>({
        sql: `SELECT * FROM (
                SELECT u.* FROM bots_queue_updates u
                WHERE u.bots_queue_id = (
                    SELECT id FROM bots_queue WHERE task_id = ? ORDER BY id DESC LIMIT 1
                )
                ORDER BY u.created_at DESC, u.id DESC LIMIT ?
            ) ORDER BY created_at ASC, id ASC`,
        values: [task_id, AppData.BotJobUpdatesShown],
    });

    return res.payload || [];
}
