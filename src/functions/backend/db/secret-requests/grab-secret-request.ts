import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_SECRET_REQUESTS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";

type Params = {
    request_id: number | string;
    /**
     * Only the user it was asked of reads it.
     */
    user_id: number | string;
};

/**
 * A secret request, only for the user it was asked of. Throws otherwise.
 */
export default async function grabSecretRequest({ request_id, user_id }: Params) {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_SECRET_REQUESTS>({
            sql: `SELECT * FROM secret_requests WHERE id = ? AND user_id = ? LIMIT 1`,
            values: [Number(request_id), Number(user_id)],
        })
    ).payload?.[0];

    if (!row?.id) throw new AppError(`That request isn't yours or no longer exists.`);

    return row;
}
