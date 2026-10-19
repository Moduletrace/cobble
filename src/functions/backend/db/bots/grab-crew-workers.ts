import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_BOTS } from "@/db/types/db";

type Params = {
    /**
     * The workspace to scope them to: only its members. Left out for the
     * whole crew (the coordinator's own chat).
     */
    workspace_id?: number | string | null;
};

/**
 * Every worker bot the coordinator can hand work to, by id. Read fresh on
 * each call rather than carried from the start of the run, so a bot
 * `create_bot` made earlier in the same reply is already there.
 */
export default async function grabCrewWorkers({
    workspace_id,
}: Params = {}): Promise<BUN_SQLITE_COBBLE_BOTS[]> {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_BOTS>({
        sql: workspace_id
            ? `SELECT b.* FROM bots b JOIN workspace_bots wb ON wb.bot_id = b.id AND wb.workspace_id = ?
                WHERE b.kind = 'worker' ORDER BY b.id ASC`
            : `SELECT * FROM bots WHERE kind = 'worker' ORDER BY id ASC`,
        values: workspace_id ? [workspace_id] : [],
    });

    return res.payload || [];
}
