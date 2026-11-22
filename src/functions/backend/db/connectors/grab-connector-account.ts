import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import parseConnectorAccountRow from "./parse-connector-account-row";

type Params = {
    account_id: number | string;
    /**
     * Only this user's accounts are returned, unless `any_owner` asks for
     * the row whoever connected it (a super admin scoping it, say): an id
     * from a stale page still can't reach someone else's credential.
     */
    user_id: number | string;
    any_owner?: boolean;
};

/**
 * One connected account, the user's own by default.
 */
export default async function grabConnectorAccount({ account_id, user_id, any_owner = false }: Params) {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS>({
        sql: any_owner
            ? `SELECT * FROM connector_accounts WHERE id = ? LIMIT 1`
            : `SELECT * FROM connector_accounts WHERE id = ? AND user_id = ? LIMIT 1`,
        values: any_owner ? [Number(account_id)] : [Number(account_id), Number(user_id)],
    });

    const row = res.payload?.[0];

    if (!row) throw new AppError(`That account isn't connected here.`);

    return parseConnectorAccountRow({ row });
}