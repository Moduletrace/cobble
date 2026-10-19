import BunSQLite from "@moduletrace/bun-sqlite";
import AppError from "@/src/utils/app-error";
import grabHarnessProviders from "./grab-harness-providers";

type Params = {
    provider_id: number;
};

/**
 * Removes a provider and its models. Harnesses (default, per bot and per workspace) that
 * picked one of its models, or were limited to it, go back to automatic
 * on any provider.
 */
export default async function deleteHarnessProvider({ provider_id }: Params) {
    const provider = (await grabHarnessProviders({ provider_id }))[0];

    if (!provider?.id) {
        throw new AppError(`Provider not found.`);
    }

    for (const table of ["harness_settings", "bot_harness_settings", "workspace_harness_settings"]) {
        await BunSQLite.sql({
            sql: `UPDATE ${table} SET model_id = NULL, provider_id = NULL, updated_at = ?
                WHERE provider_id = ? OR model_id IN (SELECT id FROM harness_models WHERE provider_id = ?)`,
            values: [Date.now(), provider.id, provider.id],
        });
    }

    const res = await BunSQLite.sql({
        sql: `DELETE FROM harness_providers WHERE id = ?`,
        values: [provider.id],
    });

    if (!res.success) {
        throw new Error(`Couldn't remove the provider: ${res.error}`);
    }
}
