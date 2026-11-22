import BunSQLite from "@moduletrace/bun-sqlite";
import type { ConnectorProviderId } from "@/src/dict/connector-dict";
import redactSecrets from "@/src/utils/redact-secrets";
import grabRunEnvs from "../extensions/grab-run-envs";
import grabConnectorConnection from "./grab-connector-connection";
import grabConnectionProvider from "./grab-connection-provider";
import planConnectorSync from "./plan-connector-sync";

type Params = {
    connection_id: number | string;
    /**
     * The super admin syncing it, kept as the connection's owner. A cron
     * sync leaves it out and the existing owner stays.
     */
    user_id?: number | string;
};

type ExistingRow = {
    app: string;
    name: string;
    description: string;
    logo: string;
};

/**
 * Connects a provider: reads its apps and stores them as connectors, so
 * every app it offers shows in Settings > Connectors without anyone adding
 * one. The connection row keeps the outcome for the page and the cron. An
 * app already stored keeps its slug, its reach and its accounts; only its
 * name, description and logo follow the provider.
 *
 * A connection is one provider account with its own key, so two Composio
 * connections list two separate sets of apps, and each app row belongs to
 * the connection it was read from.
 */
export default async function syncConnectorConnection({ connection_id, user_id }: Params) {
    const now = Date.now();
    const connection = await grabConnectorConnection({ connection_id });

    try {
        const provider = await grabConnectionProvider({ connection_id: connection.id });
        const apps = await provider.listApps();

        await storeApps({ connection, apps, now });

        await BunSQLite.sql({
            sql: `UPDATE connector_connections SET status = 'ready', last_error = '', last_synced_at = ?, updated_at = ?, user_id = ? WHERE id = ?`,
            values: [now, now, user_id ? Number(user_id) : connection.user_id, connection.id],
        });

        return { ok: true as const, app_count: apps.length };
    } catch (error: unknown) {
        const envs = await grabRunEnvs();
        const message = redactSecrets({
            text: error instanceof Error ? error.message : String(error),
            secrets: envs.filter((env) => env.secret),
        }).slice(0, 4000);

        await BunSQLite.sql({
            sql: `UPDATE connector_connections SET status = 'error', last_error = ?, last_synced_at = ?, updated_at = ? WHERE id = ?`,
            values: [message, now, now, connection.id],
        });

        return { ok: false as const, error: message, app_count: 0 };
    }
}

type StoreParams = {
    connection: { id: number; provider: ConnectorProviderId; name: string };
    apps: Awaited<ReturnType<Awaited<ReturnType<typeof grabConnectionProvider>>["listApps"]>>;
    now: number;
};

/**
 * Writes the connection's apps as connectors: a new one gets a slug no other
 * connector has, and an existing one only takes the provider's current
 * name, description and logo. Several hundred rows go in chunks, in one
 * statement each.
 */
async function storeApps({ connection, apps, now }: StoreParams) {
    const existing =
        (
            await BunSQLite.sql<ExistingRow>({
                sql: `SELECT app, name, description, logo FROM connectors WHERE connection_id = ?`,
                values: [connection.id],
            })
        ).payload || [];

    const taken =
        (
            await BunSQLite.sql<{ slug: string }>({
                sql: `SELECT slug FROM connectors`,
            })
        ).payload?.map((row) => row.slug) || [];

    const plan = planConnectorSync({
        connection,
        apps,
        existing,
        taken,
    });

    for (let index = 0; index < plan.inserts.length; index += 40) {
        const chunk = plan.inserts.slice(index, index + 40);
        const values: (string | number)[] = [];

        for (const row of chunk) {
            values.push(
                now,
                now,
                row.provider,
                row.connection_id,
                row.app,
                row.name,
                row.slug,
                row.description,
                row.logo,
                JSON.stringify(row.scopes),
                0,
                1,
                "untested",
                "",
                row.user_id,
            );
        }

        await BunSQLite.sql({
            sql: `INSERT OR IGNORE INTO connectors
                (created_at, updated_at, provider, connection_id, app, name, slug, description, logo, scopes, all_bots, enabled, status, last_error, user_id)
                VALUES ${chunk.map(() => "(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").join(", ")}`,
            values,
        });
    }

    for (const app of plan.updates) {
        await BunSQLite.sql({
            sql: `UPDATE connectors SET name = ?, description = ?, logo = ?, updated_at = ? WHERE connection_id = ? AND app = ?`,
            values: [app.name || app.app, app.description, app.logo, now, connection.id, app.app],
        });
    }
}