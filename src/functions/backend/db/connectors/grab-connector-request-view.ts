import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS, BUN_SQLITE_COBBLE_CONNECTOR_REQUESTS } from "@/db/types/db";
import AppError from "@/src/utils/app-error";
import parseConnectorAccountRow from "./parse-connector-account-row";
import grabConnector from "./grab-connector";

type Params = {
    request_id: number | string;
    /**
     * The user the card belongs to: a request never shows another's.
     */
    user_id: number | string;
};

/**
 * A connect request as its card shows it. A pending one past its time is
 * marked expired here, so the card says what happened instead of offering a
 * link that no longer works.
 */
export default async function grabConnectorRequestView({ request_id, user_id }: Params) {
    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_CONNECTOR_REQUESTS>({
        sql: `SELECT * FROM connector_requests WHERE id = ? AND user_id = ? LIMIT 1`,
        values: [Number(request_id), Number(user_id)],
    });

    const row = res.payload?.[0];

    if (!row) throw new AppError(`That connect request doesn't exist.`);

    const connector = await grabConnector({ connector_id: Number(row.connector_id) });
    const now = Date.now();
    let status = row.status || "pending";

    if (status == "pending" && Number(row.expires_at || 0) <= now) {
        status = "expired";

        await BunSQLite.sql({
            sql: `UPDATE connector_requests SET status = 'expired', updated_at = ? WHERE id = ?`,
            values: [now, Number(row.id)],
        });
    }

    const request_account = String(row.provider_account_id || "");

    // Only the account this request made counts: any connected one would
    // close a second sign-in with the first account's label, which is how a
    // second Gmail account looked already connected.
    const accountRows = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS>({
            sql: request_account
                ? `SELECT * FROM connector_accounts WHERE connector_id = ? AND user_id = ? AND status = 'connected' AND provider_account_id = ? LIMIT 1`
                : `SELECT * FROM connector_accounts WHERE connector_id = ? AND user_id = ? AND status = 'connected' AND created_at >= ? ORDER BY id ASC LIMIT 1`,
            values: request_account
                ? [connector.id, Number(user_id), request_account]
                : [connector.id, Number(user_id), Number(row.created_at || 0)],
        })
    ).payload || [];

    const matching = accountRows[0] || null;

    if (status == "pending" && matching) {
        status = "connected";

        await BunSQLite.sql({
            sql: `UPDATE connector_requests SET status = 'connected', provider_account_id = ?, updated_at = ? WHERE id = ?`,
            values: [String(matching.provider_account_id || ""), now, Number(row.id)],
        });
    }

    return {
        id: Number(row.id),
        connector_id: connector.id,
        connector_name: connector.name,
        label: row.label || "",
        status,
        url: row.url || "",
        expires_at: Number(row.expires_at || 0),
        account: matching ? parseConnectorAccountRow({ row: matching }) : null,
    };
}