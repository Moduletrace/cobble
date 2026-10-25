import syncAllHarnessModels from "@/src/functions/backend/db/harness/sync-all-harness-models";
import { logError } from "@/src/functions/backend/logger";

/**
 * Refreshes every enabled provider's model list. Free models on OpenRouter
 * come and go, and automatic picks follow them from this list. A provider
 * that fails doesn't fail the run, so its error goes to the logs here.
 */
export default async function cronSyncHarnessModels() {
    const results = await syncAllHarnessModels();

    for (const result of results) {
        if (!result.error) continue;

        await logError({
            title: `Cron: model sync for provider #${result.provider_id} failed`,
            category: "cron",
            error: result.error,
            metadata: { provider_id: result.provider_id },
        }).catch(() => {});
    }

    return results;
}
