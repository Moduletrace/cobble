import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS } from "@/db/types/db";
import grabConnectorProvider from "./grab-connector-provider";
import type { ProviderAccount } from "@/src/harness/connectors/connector-provider";
import type { ConnectorAccountRecord } from "@/src/types";
import connectorSlug from "@/src/utils/connector-slug";
import grabConnector from "./grab-connector";
import parseConnectorAccountRow from "./parse-connector-account-row";
import shouldAdoptConnectorAccount from "./should-adopt-connector-account";

type Params = {
    user_id: number | string;
    connector_id: number | string;
    /**
     * The name the user typed for the account when they started the
     * sign-in, used only when the provider gives none.
     */
    label?: string;
};

/**
 * Reads the user's accounts for a connector at its provider and brings the
 * local rows in line: new sign-ins are added (the first connected one is the
 * default), ones the provider reports expired say so, and ones it no longer
 * lists are marked revoked without losing their label. Pending connect
 * requests are closed as soon as an account is connected.
 */
export default async function syncConnectorAccounts({ user_id, connector_id, label }: Params) {
    const connector = await grabConnector({ connector_id });
    const provider = await grabConnectorProvider({ connector_id: connector.id });
    const accounts = await provider.accounts({ app: connector.app, user_id: Number(user_id) });

    const local = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS>({
            sql: `SELECT * FROM connector_accounts WHERE connector_id = ? AND user_id = ? ORDER BY id ASC`,
            values: [connector.id, Number(user_id)],
        })
    ).payload || [];

    const requests = (
        await BunSQLite.sql<{ account_id: number; provider_account_id: string }>({
            sql: `SELECT account_id, provider_account_id FROM connector_requests WHERE connector_id = ? AND user_id = ? AND status = 'pending' AND provider_account_id != ''`,
            values: [connector.id, Number(user_id)],
        })
    ).payload || [];
    const reconnect_for = new Map(
        requests.filter((row) => Number(row.account_id) != 0).map((row) => [String(row.provider_account_id), Number(row.account_id)]),
    );
    /**
     * A sign-in only becomes a row once it is connected, or while the request
     * that started it is still open. A pending account nothing here asked for
     * is an abandoned or replaced sign-in at the provider (Composio keeps one
     * `INITIALIZING` per abandoned link), and adopting it would put a second,
     * never connected account beside the one a reconnect replaced.
     */
    const claimed = new Set(requests.map((row) => String(row.provider_account_id)));

    const seen = new Set(accounts.map((account) => account.provider_account_id));
    const now = Date.now();
    const hasConnected = local.some((row) => row.status == "connected");

    for (const row of local) {
        if (seen.has(String(row.provider_account_id || ""))) continue;

        await BunSQLite.sql({
            sql: `UPDATE connector_accounts SET status = 'revoked', last_checked_at = ?, updated_at = ? WHERE id = ?`,
            values: [now, now, Number(row.id)],
        });
    }

    let firstConnected: number | null = hasConnected ? null : 0;

    for (const account of accounts) {
        const provider_account_id = String(account.provider_account_id);
        const reconnect_id = reconnect_for.get(provider_account_id);

        if (
            !shouldAdoptConnectorAccount({
                status: account.status,
                reconnect: Boolean(reconnect_id),
                claimed: claimed.has(provider_account_id),
            })
        )
            continue;

        await upsertAccount({
            connector_id: connector.id,
            user_id: Number(user_id),
            account,
            fallback_label: label,
            reconnect_id,
        });

        if (account.status != "connected") continue;

        if (firstConnected === 0) {
            const created = (
                await BunSQLite.sql<{ id: number }>({
                    sql: `SELECT id FROM connector_accounts WHERE connector_id = ? AND user_id = ? AND provider_account_id = ? LIMIT 1`,
                    values: [connector.id, Number(user_id), account.provider_account_id],
                })
            ).payload?.[0];

            if (created) firstConnected = created.id;
        }
    }

    if (firstConnected && firstConnected > 0) {
        await BunSQLite.sql({ sql: `UPDATE connector_accounts SET is_default = 1 WHERE id = ?`, values: [firstConnected] });
    }

    const connected_ids = accounts
        .filter((account) => account.status == "connected")
        .map((account) => account.provider_account_id)
        .filter(Boolean);

    if (connected_ids.length) {
        await settleRequests({
            connector_id: connector.id,
            user_id: Number(user_id),
            provider_account_ids: connected_ids,
        });
    }

    return grabUserAccounts({ connector_id: connector.id, user_id: Number(user_id) });
}

type UpsertParams = {
    connector_id: number;
    user_id: number;
    account: ProviderAccount;
    fallback_label?: string;
    /**
     * The row a reconnect replaces: its provider id is gone, so the new
     * sign-in takes its place instead of arriving as a second account.
     */
    reconnect_id?: number;
};

async function upsertAccount({ connector_id, user_id, account, fallback_label, reconnect_id }: UpsertParams) {
    const now = Date.now();

    if (reconnect_id) {
        await BunSQLite.sql({
            sql: `UPDATE connector_accounts SET provider_account_id = ?, status = ?, connected_at = ?, last_checked_at = ?, last_error = '', updated_at = ?
                WHERE id = ? AND connector_id = ? AND user_id = ?`,
            values: [
                account.provider_account_id,
                account.status,
                account.status == "connected" ? now : null,
                now,
                now,
                reconnect_id,
                connector_id,
                user_id,
            ],
        });

        return;
    }

    const existing = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS>({
            sql: `SELECT * FROM connector_accounts WHERE connector_id = ? AND user_id = ? AND provider_account_id = ? LIMIT 1`,
            values: [connector_id, user_id, account.provider_account_id],
        })
    ).payload?.[0];

    if (existing) {
        await BunSQLite.sql({
            sql: `UPDATE connector_accounts SET status = ?, label = ?, connected_at = ?, last_checked_at = ?, last_error = '', updated_at = ? WHERE id = ?`,
            values: [
                account.status,
                account.label || String(existing.label || ""),
                account.status == "connected"
                    ? Number(existing.connected_at) || now
                    : existing.connected_at
                      ? Number(existing.connected_at)
                      : null,
                now,
                now,
                Number(existing.id),
            ],
        });

        return;
    }

    /**
     * A reconnect the provider gave no id for still lands on the row it
     * replaces: one dead row with this account's name is that row, and a
     * second one with the same name would be the duplicate this prevents.
     */
    const name = account.label || fallback_label || "";
    const dead = name
        ? ((
              await BunSQLite.sql<BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS>({
                  sql: `SELECT * FROM connector_accounts WHERE connector_id = ? AND user_id = ? AND status IN ('revoked', 'expired') AND lower(label) = lower(?) ORDER BY id ASC`,
                  values: [connector_id, user_id, name],
              })
          ).payload || [])
        : [];

    if (dead.length == 1) {
        const row = dead[0]!;

        await BunSQLite.sql({
            sql: `UPDATE connector_accounts SET provider_account_id = ?, status = ?, connected_at = ?, last_checked_at = ?, last_error = '', updated_at = ? WHERE id = ?`,
            values: [
                account.provider_account_id,
                account.status,
                account.status == "connected" ? now : null,
                now,
                now,
                Number(row.id),
            ],
        });

        return;
    }

    const taken = (
        await BunSQLite.sql<{ slug: string }>({
            sql: `SELECT slug FROM connector_accounts WHERE connector_id = ? AND user_id = ?`,
            values: [connector_id, user_id],
        })
    ).payload?.map((row) => row.slug) || [];

    const display_name = name || "Account";
    let slug = connectorSlug({ name: display_name, max: 12, fallback: "account" });

    for (let index = 2; taken.includes(slug); index++) {
        slug = `${connectorSlug({ name: display_name, max: 8, fallback: "account" })}-${index}`;
    }

    await BunSQLite.sql({
        sql: `INSERT INTO connector_accounts
            (created_at, updated_at, connector_id, user_id, label, slug, provider_account_id, status, is_default, connected_at, last_checked_at, last_error)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, '')`,
        values: [
            now,
            now,
            connector_id,
            user_id,
            display_name,
            slug,
            account.provider_account_id,
            account.status,
            account.status == "connected" ? now : null,
            now,
        ],
    });
}

type SettleParams = {
    connector_id: number;
    user_id: number;
    provider_account_ids: string[];
};

/**
 * A connect request is done only when the account it made is connected: a
 * second sign-in must not be closed by the first account that was already
 * there (`provider_account_id` is what the provider returned for this link).
 * A request the provider gave no id for falls back to an account created
 * after the request.
 */
async function settleRequests({ connector_id, user_id, provider_account_ids }: SettleParams) {
    const now = Date.now();
    const placeholders = provider_account_ids.map(() => "?").join(", ");

    await BunSQLite.sql({
        sql: `UPDATE connector_requests SET status = 'connected', updated_at = ?
            WHERE connector_id = ? AND user_id = ? AND status = 'pending'
            AND expires_at > ?
            AND (
                (provider_account_id != '' AND provider_account_id IN (${placeholders}))
                OR (provider_account_id == '' AND EXISTS (
                    SELECT 1 FROM connector_accounts a
                    WHERE a.connector_id = connector_requests.connector_id
                    AND a.user_id = connector_requests.user_id
                    AND a.status = 'connected'
                    AND a.created_at >= connector_requests.created_at
                ))
            )`,
        values: [now, connector_id, user_id, now, ...provider_account_ids],
    });
}

type GrabParams = {
    connector_id: number;
    user_id: number;
};

async function grabUserAccounts({ connector_id, user_id }: GrabParams): Promise<ConnectorAccountRecord[]> {
    const rows = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS>({
            sql: `SELECT * FROM connector_accounts WHERE connector_id = ? AND user_id = ? ORDER BY id ASC`,
            values: [connector_id, user_id],
        })
    ).payload || [];

    return rows.map((row) => parseConnectorAccountRow({ row }));
}