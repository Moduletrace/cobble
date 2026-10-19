import type { BUN_SQLITE_COBBLE_HARNESS_PROVIDERS } from "@/db/types/db";
import type { HarnessProviderKind } from "@/src/dict/harness-provider-dict";
import grabProviderPreset from "@/src/harness/providers/grab-provider-preset";
import type { HarnessProviderConfig } from "@/src/harness/types";
import { decrypt } from "@/src/utils/crypt";
import grabEnv from "../envs/grab-env";

type Params = {
    provider: BUN_SQLITE_COBBLE_HARNESS_PROVIDERS;
};

/**
 * A provider row as the adapters need it, with its key decrypted (or, if
 * none is saved, the preset's env: set in Settings, under Environment, or
 * the process environment, `grabEnv`). `usable` is
 * false when the provider needs a key and has none.
 */
export default async function resolveProviderConfig({
    provider,
}: Params): Promise<{ config: HarnessProviderConfig; usable: boolean }> {
    const preset = grabProviderPreset({ kind: provider.kind });
    let api_key: string | undefined;

    if (provider.api_key) {
        api_key = await decrypt(provider.api_key).catch(() => undefined);
    }

    if (!api_key && preset.key_env) {
        api_key = await grabEnv({ key: preset.key_env });
    }

    const config: HarnessProviderConfig = {
        id: provider.id || undefined,
        kind: preset.value as HarnessProviderKind,
        name: provider.name || preset.title,
        base_url: provider.base_url || preset.base_url,
        api_key,
    };

    return {
        config,
        usable: Boolean(config.base_url) && (!preset.needs_key || !!api_key),
    };
}
