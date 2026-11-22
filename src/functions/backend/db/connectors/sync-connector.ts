import BunSQLite from "@moduletrace/bun-sqlite";
import grabConnectorProvider from "./grab-connector-provider";
import redactSecrets from "@/src/utils/redact-secrets";
import grabRunEnvs from "../extensions/grab-run-envs";
import grabConnector from "./grab-connector";

type Params = {
    connector_id: number | string;
};

/**
 * Lists the app's tools at its provider and saves them, which is what runs
 * build their tools from. Saves the outcome on the connector (`status`,
 * `last_error`, secrets blanked out) and returns it; never throws for the
 * provider's own failure.
 */
export default async function syncConnector({ connector_id }: Params) {
    const connector = await grabConnector({ connector_id });
    const envs = await grabRunEnvs();
    const now = Date.now();

    try {
        const provider = await grabConnectorProvider({ connector_id: connector.id });
        const tools = await provider.listTools({ app: connector.app });

        await BunSQLite.sql({
            sql: `UPDATE connectors SET tools_cache = ?, status = 'ready', last_error = '', last_synced_at = ? WHERE id = ?`,
            values: [JSON.stringify(tools), now, connector.id],
        });

        return { ok: true as const, tools };
    } catch (error: unknown) {
        const message = redactSecrets({
            text: error instanceof Error ? error.message : String(error),
            secrets: envs.filter((env) => env.secret),
        }).slice(0, 4000);

        await BunSQLite.sql({
            sql: `UPDATE connectors SET status = 'error', last_error = ?, last_synced_at = ? WHERE id = ?`,
            values: [message, now, connector.id],
        });

        return { ok: false as const, error: message };
    }
}