import ensureDefaultHarnessProvider from "./ensure-default-harness-provider";
import grabHarnessProviders from "./grab-harness-providers";
import syncHarnessProviderModels from "./sync-harness-provider-models";

/**
 * Refreshes every enabled provider's model list, so automatic picks follow
 * free models as they come and go. One provider failing doesn't stop the
 * rest; its error is saved on its row.
 */
export default async function syncAllHarnessModels() {
    await ensureDefaultHarnessProvider();

    const providers = await grabHarnessProviders({ enabled_only: true });
    const results: { provider_id?: number; count?: number; error?: string }[] =
        [];

    for (const provider of providers) {
        try {
            const count = await syncHarnessProviderModels({ provider });
            results.push({ provider_id: provider.id || undefined, count });
        } catch (error: unknown) {
            results.push({
                provider_id: provider.id || undefined,
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }

    return results;
}
