import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CONNECTOR_ACCOUNTS } from "@/db/types/db";
import grabConnectorProvider from "./grab-connector-provider";
import type { ProviderAccount } from "@/src/harness/connectors/connector-provider";
import type { ConnectorAccountRecord } from "@/src/types";
import connectorSlug from "@/src/utils/connector-slug";
import grabConnector from "./grab-connector";
import parseConnectorAccountRow from "./parse-connector-account-row";
import shouldAdoptConnectorAccount from "./should-adopt-connector-account";
import insertConnectorAccountSql from "./insert-connector-account-sql";

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
 * local rows in line: the account a sign-in here made is added (the first
 * connected one is the default), ones the provider reports expired say so, and
 * ones it no longer lists are marked revoked without losing their label.
 * Pending connect requests are closed as soon as the account they made is
 * connected.
 *
 * One card per sign-in: an account no request here made is left at the
 * provider, so a leftover from an earlier attempt there cannot arrive as a
 * second card of the same mailbox beside the one its own sign-in made.
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
            sql: `SELECT account_id, provider_account_id FROM connector_requests WHERE connector_id = ? AND user_id = ? AND status = 'pending'`,
            values: [connector.id, Number(user_id)],
        })
    ).payload || [];
    const reconnect_for = new Map(
        requests
            .filter((row) => Number(row.account_id) != 0 && row.provider_account_id)
            // A row disconnected since is no target: that sign-in arrives as a new one.
            .filter((request) => local.some((account) => Number(account.id) == Number(request.account_id)))
            .map((row) => [String(row.provider_account_id), Number(row.account_id)]),
    );
    let reconnect_row = pendingReconnectRow(requests);
    // A row disconnected since is no target: that sign-in arrives as a new one.
    if (reconnect_row && !local.some((row) => Number(row.id) == reconnect_row)) reconnect_row = null;
    /**
     * A sign-in only becomes a row once it is connected, and only the account
     * its own request names. A pending account nothing here asked for is an
     * abandoned or replaced sign-in at the provider (Composio keeps one
     * `INITIALIZING` per abandoned link), and adopting it would put a second,
     * never connected account beside the one a reconnect replaced.
     */
    const claimed = new Set(requests.map((row) => String(row.provider_account_id || "")).filter(Boolean));
    /**
     * A new sign-in the provider named no account for: the first connected
     * account it didn't already have is that sign-in, once.
     */
    let unclaimed_sign_in = requests.some((row) => Number(row.account_id) == 0 && !row.provider_account_id);

    const seen = new Set(accounts.map((account) => account.provider_account_id));
    const now = Date.now();

    /**
     * A listing that names no account is the provider unable to answer, not
     * every account deleted there: revoking them all would put Reconnect on
     * cards that are fine.
     */
    if (accounts.length) {
        for (const row of local) {
            if (seen.has(String(row.provider_account_id || ""))) continue;

            await BunSQLite.sql({
                sql: `UPDATE connector_accounts SET status = 'revoked', last_checked_at = ?, updated_at = ? WHERE id = ?`,
                values: [now, now, Number(row.id)],
            });
        }
    }

    let firstConnected: number | null = local.some((row) => row.status == "connected") ? null : 0;

    for (const account of accounts) {
        const provider_account_id = String(account.provider_account_id);
        const reconnect_id = reconnect_for.get(provider_account_id);

        if (
            !shouldAdoptConnectorAccount({
                status: account.status,
                reconnect: Boolean(reconnect_id) || Boolean(reconnect_row),
                claimed:
                    claimed.has(provider_account_id) ||
                    (unclaimed_sign_in &&
                        !local.some((row) => String(row.provider_account_id || "") == provider_account_id)),
            })
        )
            continue;

        await upsertAccount({
            connector_id: connector.id,
            user_id: Number(user_id),
            account,
            fallback_label: label,
            reconnect_id,
            reconnect_row,
        });

        reconnect_row = null;
        unclaimed_sign_in = false;

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

export function pendingReconnectRow(requests: Array<{ account_id: number; provider_account_id: string }>) {
    const named = requests.find((row) => Number(row.account_id) != 0 && !row.provider_account_id);

    return Number(named?.account_id || 0) || null;
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
    /**
     * That row when the provider gave the sign-in no id at all: the request
     * names it, so it's never guessed from a name or a sole dead row, which
     * would hand a new mailbox the dead one's label and namespace.
     */
    reconnect_row?: number | null;
};

async function upsertAccount({ connector_id, user_id, account, fallback_label, reconnect_id, reconnect_row }: UpsertParams) {
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
     * An id-less reconnect lands on the row it replaces, named by its request.
     * A row that is merely dead is not it: a new mailbox that arrives while
     * one dead row exists would otherwise take that row's name and namespace.
     * Only a connected account takes it, since an abandoned link at the
     * provider stays pending, and only once.
     */
    if (reconnect_row) {
        await BunSQLite.sql({
            sql: `UPDATE connector_accounts SET provider_account_id = ?, status = ?, connected_at = ?, last_checked_at = ?, last_error = '', updated_at = ?
                WHERE id = ? AND connector_id = ? AND user_id = ?`,
            values: [
                account.provider_account_id,
                account.status,
                account.status == "connected" ? now : null,
                now,
                now,
                reconnect_row,
                connector_id,
                user_id,
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

    const display_name = account.label || fallback_label || "Account";
    let slug = connectorSlug({ name: display_name, max: 12, fallback: "account" });

    for (let index = 2; taken.includes(slug); index++) {
        slug = `${connectorSlug({ name: display_name, max: 8, fallback: "account" })}-${index}`;
    }

    const { sql, values } = insertConnectorAccountSql({
        now,
        connector_id,
        user_id,
        label: display_name,
        slug,
        provider_account_id: account.provider_account_id,
        status: account.status,
    });

    await BunSQLite.sql({ sql, values });
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
                    AND (a.created_at >= connector_requests.created_at OR a.id = connector_requests.account_id)
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