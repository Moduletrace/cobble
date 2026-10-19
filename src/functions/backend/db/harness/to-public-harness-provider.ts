import type { BUN_SQLITE_COBBLE_HARNESS_PROVIDERS } from "@/db/types/db";
import grabProviderPreset from "@/src/harness/providers/grab-provider-preset";
import type { PublicHarnessProvider } from "@/src/types";

type Params = {
    provider: BUN_SQLITE_COBBLE_HARNESS_PROVIDERS;
};

/**
 * A provider row safe for the client: the key is dropped, only whether
 * one is saved (or set in the environment) is kept.
 */
export default function toPublicHarnessProvider({
    provider,
}: Params): PublicHarnessProvider {
    const preset = grabProviderPreset({ kind: provider.kind });

    return {
        id: provider.id || 0,
        kind: preset.value,
        name: provider.name || preset.title,
        base_url: provider.base_url || preset.base_url,
        enabled: provider.enabled != 0,
        has_key: Boolean(provider.api_key),
        has_env_key: Boolean(preset.key_env && process.env[preset.key_env]),
        needs_key: preset.needs_key,
        key_env: preset.key_env || undefined,
        last_synced_at: provider.last_synced_at || undefined,
        sync_error: provider.sync_error || undefined,
    };
}
