import syncAllHarnessModels from "@/src/functions/backend/db/harness/sync-all-harness-models";
import grabInstallEmbeddingModel from "@/src/functions/backend/db/knowledgebases/grab-install-embedding-model";
import reindexAfterEmbeddingChange from "@/src/functions/backend/db/knowledgebases/reindex-after-embedding-change";
import { logError } from "@/src/functions/backend/logger";

/**
 * Refreshes every enabled provider's model list. Free models on OpenRouter
 * come and go, and automatic picks follow them from this list. A provider
 * that fails doesn't fail the run, so its error goes to the logs here.
 * When the refresh changes the install's embedding model (its pick left
 * the catalog), knowledgebases are read again with the new one.
 */
export default async function cronSyncHarnessModels() {
    const embedding_before = await grabInstallEmbeddingModel();
    const results = await syncAllHarnessModels();

    await reindexAfterEmbeddingChange({ before: embedding_before }).catch((error) =>
        logError({ title: "Cron: knowledgebase re-index after a model change failed", category: "cron", error }).catch(
            () => {},
        ),
    );

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
