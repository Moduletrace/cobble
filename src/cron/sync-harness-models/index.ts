import bunext from "@moduletrace/bunext";
import syncAllHarnessModels from "@/src/functions/backend/db/harness/sync-all-harness-models";

/**
 * Refreshes every enabled provider's model list. Free models on OpenRouter
 * come and go, and automatic picks follow them from this list.
 */
export default async function cronSyncHarnessModels() {
    const results = await syncAllHarnessModels();

    for (const result of results) {
        if (result.error) {
            bunext.bunextLog.error(
                `Cron: model sync for provider #${result.provider_id} failed: ${result.error}`,
            );
        } else {
            bunext.bunextLog.info(
                `Cron: provider #${result.provider_id} lists ${result.count} model(s)`,
            );
        }
    }

    return results;
}
