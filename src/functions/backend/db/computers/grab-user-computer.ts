import type { BUN_SQLITE_COBBLE_COMPUTERS } from "@/db/types/db";
import BunSQLite from "@moduletrace/bun-sqlite";
import computersSql from "@/src/utils/crew-access/computers-sql";
import grabCrewRole from "../access/grab-crew-role";

type Params = {
    computer_id: number | string;
    user_id: number | string;
};

/**
 * A computer only if the user sees it (`computersSql`).
 */
export default async function grabUserComputer({
    computer_id,
    user_id,
}: Params): Promise<BUN_SQLITE_COBBLE_COMPUTERS | null> {
    const access = computersSql({ role: await grabCrewRole({ user_id }), user_id });

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_COMPUTERS>({
        sql: `SELECT c.* FROM computers c WHERE c.id = ? AND ${access.sql} LIMIT 1`,
        values: [computer_id, ...access.values],
    });

    return res.payload?.[0] || null;
}
