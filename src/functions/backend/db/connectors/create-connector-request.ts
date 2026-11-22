import AppError from "@/src/utils/app-error";
import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_CONNECTOR_REQUESTS, BunSQLiteTables } from "@/db/types/db";
import { AppData } from "@/src/data/app-data";
import type { ConnectorRecord } from "@/src/types";
import grabConnectorProvider from "./grab-connector-provider";

type Params = {
    user_id: number;
    /**
     * The bot whose conversation asked, null outside one.
     */
    bot_id?: number | null;
    /**
     * The conversation to wake once the account is connected, null when
     * the request came from Settings.
     */
    session_id?: number | null;
    connector: ConnectorRecord;
    label?: string;
};

export type ConnectorRequest = {
    id: number;
    url: string;
    expires_at: number;
};

/**
 * A connect link for one user and one connector, either the open one or a
 * new one. A second call while the first card still stands returns the
 * same link, so a bot that reports the missing account twice never sends the
 * user two links (one of which the provider would have already spent).
 */
export default async function createConnectorRequest({
    user_id,
    bot_id,
    session_id,
    connector,
    label,
}: Params): Promise<ConnectorRequest> {
    const now = Date.now();
    const open = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_CONNECTOR_REQUESTS>({
            sql: `SELECT * FROM connector_requests WHERE connector_id = ? AND user_id = ? AND status = 'pending' AND expires_at > ? ORDER BY id DESC LIMIT 1`,
            values: [connector.id, user_id, now],
        })
    ).payload?.[0];

    if (open?.url) return { id: Number(open.id), url: open.url, expires_at: Number(open.expires_at) };

    const provider = await grabConnectorProvider({ connector_id: connector.id });
    const started = await provider.startConnect({
        app: connector.app,
        user_id,
        label: label || connector.name,
        auth_config_id: connector.auth_config_id,
    });

    if (started.auth_config_id && started.auth_config_id != connector.auth_config_id) {
        await BunSQLite.sql({
            sql: `UPDATE connectors SET auth_config_id = ?, updated_at = ? WHERE id = ?`,
            values: [started.auth_config_id, now, connector.id],
        });
    }

    const provided_expiry = Number(started.expires_at || 0);
    const expires_at =
        provided_expiry > now ? Math.min(now + AppData.ConnectorRequestTtlMs, provided_expiry) : now + AppData.ConnectorRequestTtlMs;

    await BunSQLite.sql({
        sql: `UPDATE connector_requests SET status = 'cancelled' WHERE connector_id = ? AND user_id = ? AND status = 'pending'`,
        values: [connector.id, user_id],
    });

    const created = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_CONNECTOR_REQUESTS,
        (typeof BunSQLiteTables)[number]
    >({
        table: "connector_requests",
        data: [
            {
                connector_id: connector.id,
                user_id,
                bot_id: bot_id ?? undefined,
                bot_session_id: session_id ?? undefined,
                label: label || connector.name,
                url: started.url,
                provider_account_id: started.provider_account_id || undefined,
                status: "pending",
                expires_at,
            },
        ],
    });

    const id = Number(created.singleRes?.id || created.postInsertReturn?.insertId);

    if (!created.success || !id) throw new AppError(`Couldn't store the connect request: ${created.msg}`);

    return { id, url: started.url, expires_at };
}