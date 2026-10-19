import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";

/**
 * Every worker and every workspace (not archived), for picking what a
 * user may reach. Never the coordinator: it's the super admin's alone.
 */
export default async function grabCrewOptions() {
    const [bots, workspaces] = await Promise.all([
        BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
            sql: `SELECT id, name, role, hue, image_media_id FROM bots WHERE kind = 'worker' ORDER BY name COLLATE NOCASE ASC, id ASC`,
        }),
        BunSQLite.sql<BUN_SQLITE_COBBLE_WORKSPACES>({
            sql: `SELECT id, name, description, image_media_id FROM workspaces WHERE archived = 0 ORDER BY name COLLATE NOCASE ASC, id ASC`,
        }),
    ]);

    return { crew_bots: bots.payload || [], crew_workspaces: workspaces.payload || [] };
}
