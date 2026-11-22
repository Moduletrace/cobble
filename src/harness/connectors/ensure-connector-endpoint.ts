import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CONNECTOR_SESSIONS } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import { ConnectorProviders } from "@/src/dict/connector-dict";
import AppError from "@/src/utils/app-error";
import { decrypt, encrypt } from "@/src/utils/crypt";
import type { ConnectorAccountRecord, ConnectorRecord } from "@/src/types";
import connectorAccountGoneMessage from "./connector-account-gone";
import type { ConnectorProvider } from "./connector-provider";

/**
 * When each account was last checked against the provider, per process: the
 * check is a listing of every account the user has, and a cached session is
 * used many times a minute.
 */
const accountChecks = new Map<string, number>();
const AccountCheckEveryMs = 5 * 60 * 1000;

/**
 * The endpoint one account's tools live at, cached in `connector_sessions`
 * because asking the provider costs a call and the session expires.
 *
 * `rest` is the fallback for a provider whose session can't be pinned to
 * one account: the same tools, executed through the provider's REST API
 * with the account named in each call. It's remembered for
 * `AppData.ConnectorRestRetryMs`, then the session is tried again.
 */
export type ConnectorEndpointResult =
    | { kind: "mcp"; url: string; headers: Record<string, string> }
    | { kind: "rest" };

type Params = {
    connector: ConnectorRecord;
    provider: ConnectorProvider;
    user_id: number;
    account: ConnectorAccountRecord;
};

/**
 * A cached session's headers, or null when the stored copy can't be read.
 * Null means the cache is unusable, never that the endpoint wants no
 * headers: a session read as "no key" once reached the provider keyless and
 * every tool came back with a 401, so a broken copy is rebuilt instead.
 */
async function readCachedHeaders({ headers }: { headers: string | null }): Promise<Record<string, string> | null> {
    if (!headers) return null;

    try {
        const parsed = JSON.parse(await decrypt(headers));

        return parsed && typeof parsed == "object" && !Array.isArray(parsed)
            ? (parsed as Record<string, string>)
            : null;
    } catch {
        return null;
    }
}

/**
 * A row can name an account the provider no longer has (a second sign-in
 * replaced it, a connection was cleared there). A session pinned to that id
 * is not refused: the provider answers from whichever account it does have,
 * so a bot read a mailbox the user never chose. The row is marked revoked
 * (its card then offers Reconnect) and the call stops instead.
 *
 * The check lists every account the user has, so it is remembered per account
 * for `AccountCheckEveryMs`: a cached session is checked too, at that pace
 * rather than on every tool call.
 */
async function assertAccountStillThere({ connector, provider, user_id, account, now }: Params & { now: number }) {
    const key = `${connector.id}:${account.provider_account_id}`;

    if (now - (accountChecks.get(key) || 0) < AccountCheckEveryMs) return;

    if (accountChecks.size > 1000) accountChecks.clear();

    accountChecks.set(key, now);

    let accounts: Awaited<ReturnType<ConnectorProvider["accounts"]>>;

    try {
        accounts = await provider.accounts({ app: connector.app, user_id });
    } catch {
        // The provider is the one to say why the session failed; a list that
        // can't be read is not proof the account is gone.
        return;
    }

    if (accounts.some((entry) => entry.provider_account_id == account.provider_account_id)) return;

    await BunSQLite.sql({
        sql: `UPDATE connector_accounts SET status = 'revoked', last_checked_at = ?, updated_at = ? WHERE id = ?`,
        values: [now, now, Number(account.id)],
    });

    const provider_title =
        ConnectorProviders.find((entry) => entry.value == connector.provider)?.title || connector.provider;

    throw new AppError(
        connectorAccountGoneMessage({
            connector_name: connector.name,
            label: account.label,
            provider_title,
        }),
    );
}

export default async function ensureConnectorEndpoint({
    connector,
    provider,
    user_id,
    account,
}: Params): Promise<ConnectorEndpointResult> {
    const now = Date.now();

    await assertAccountStillThere({ connector, provider, user_id, account, now });

    const cached = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_CONNECTOR_SESSIONS>({
            sql: `SELECT * FROM connector_sessions WHERE connector_id = ? AND user_id = ? AND provider_account_id = ? LIMIT 1`,
            values: [connector.id, user_id, account.provider_account_id],
        })
    ).payload?.[0];

    if (cached && Number(cached.expires_at ?? 0) > now) {
        if (cached.session_id == "rest") return { kind: "rest" };

        if (cached.mcp_url) {
            const headers = await readCachedHeaders({
                headers: cached.headers || null,
            });

            if (headers) {
                return { kind: "mcp", url: cached.mcp_url, headers };
            }
        }
    }

    const tools = connector.tools
        .map((tool) => tool.name)
        .filter((name) => !connector.excluded_tools.includes(name));

    let session_id: string | null = null;
    let url = "";
    let headers = "{}";
    let expires_at = now + AppData.ConnectorSessionTtlMs;

    try {
        const endpoint = await provider.endpoint({
            app: connector.app,
            user_id,
            account: account.provider_account_id,
            tools,
        });

        session_id = endpoint.session_id || null;
        url = endpoint.url;
        headers = await encrypt(JSON.stringify(endpoint.headers || {}));
        expires_at = endpoint.expires_at || expires_at;
    } catch {
        // A provider that can't pin one account to a session still executes
        // each tool with the account named, so the run loses nothing but the
        // session. The call itself reports whatever is really wrong.
        session_id = "rest";
        expires_at = now + AppData.ConnectorRestRetryMs;
    }

    await BunSQLite.sql({
        sql: `INSERT OR REPLACE INTO connector_sessions (connector_id, user_id, provider_account_id, session_id, mcp_url, headers, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        values: [connector.id, user_id, account.provider_account_id, session_id, url || null, headers, expires_at],
    });

    if (session_id == "rest" || !url) return { kind: "rest" };

    return { kind: "mcp", url, headers: JSON.parse(await decrypt(headers)) };
}