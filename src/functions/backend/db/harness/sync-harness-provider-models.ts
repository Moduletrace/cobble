import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_HARNESS_PROVIDERS } from "@/db/types/db";
import grabHarnessAdapter from "@/src/harness/providers/grab-harness-adapter";
import resolveProviderConfig from "./resolve-provider-config";
import upsertHarnessModels from "./upsert-harness-models";

type Params = {
    provider: BUN_SQLITE_COBBLE_HARNESS_PROVIDERS;
};

/**
 * Fetches one provider's model list into `harness_models`, and records
 * when it ran and why it failed, if it did. Returns how many models the
 * provider listed. Throws when the list couldn't be fetched.
 */
export default async function syncHarnessProviderModels({ provider }: Params) {
    if (!provider.id) {
        throw new Error(`Provider has no id`);
    }

    const { config } = await resolveProviderConfig({ provider });

    try {
        const models = await grabHarnessAdapter({
            kind: config.kind,
        }).listModels({ provider: config });

        const count = await upsertHarnessModels({
            provider_id: provider.id,
            models,
        });

        await BunSQLite.sql({
            sql: `UPDATE harness_providers SET last_synced_at = ?, sync_error = NULL, updated_at = ? WHERE id = ?`,
            values: [Date.now(), Date.now(), provider.id],
        });

        return count;
    } catch (error: unknown) {
        await BunSQLite.sql({
            sql: `UPDATE harness_providers SET sync_error = ?, updated_at = ? WHERE id = ?`,
            values: [
                (error instanceof Error ? error.message : String(error)).slice(
                    0,
                    500,
                ),
                Date.now(),
                provider.id,
            ],
        });

        throw error;
    }
}
