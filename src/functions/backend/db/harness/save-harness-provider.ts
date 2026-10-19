import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_HARNESS_PROVIDERS,
    BunSQLiteTables,
} from "@/db/types/db";
import type { HarnessProviderKind } from "@/src/dict/harness-provider-dict";
import grabProviderPreset from "@/src/harness/providers/grab-provider-preset";
import AppError from "@/src/utils/app-error";
import { encrypt } from "@/src/utils/crypt";
import grabHarnessProviders from "./grab-harness-providers";

type Params = {
    /**
     * Updates this provider; adds one when not given.
     */
    provider_id?: number;
    kind: HarnessProviderKind;
    name?: string;
    base_url?: string;
    /**
     * A new key. Left out keeps the saved one.
     */
    api_key?: string;
    clear_key?: boolean;
    enabled: boolean;
};

/**
 * Adds or updates a model provider. The key is encrypted before it's
 * stored and never read back to the client. Returns the provider row.
 */
export default async function saveHarnessProvider({
    provider_id,
    kind,
    name,
    base_url,
    api_key,
    clear_key,
    enabled,
}: Params) {
    const preset = grabProviderPreset({ kind });
    const final_base_url = (base_url || preset.base_url).trim().replace(/\/+$/, "");

    if (!/^https?:\/\/[^\s/]+/i.test(final_base_url)) {
        throw new AppError(`Enter the provider's API address, starting with http:// or https://.`);
    }

    const existing = provider_id
        ? (await grabHarnessProviders({ provider_id }))[0]
        : undefined;

    if (provider_id && !existing) {
        throw new AppError(`Provider not found.`);
    }

    const key_update = api_key?.trim()
        ? { api_key: await encrypt(api_key.trim()) }
        : clear_key
          ? { api_key: "" }
          : {};

    const data: BUN_SQLITE_COBBLE_HARNESS_PROVIDERS = {
        kind: preset.value,
        name: name?.trim() || preset.title,
        base_url: final_base_url,
        enabled: enabled ? 1 : 0,
        ...key_update,
    };

    if (existing?.id) {
        const res = await BunSQLite.update<
            BUN_SQLITE_COBBLE_HARNESS_PROVIDERS,
            (typeof BunSQLiteTables)[number]
        >({
            table: "harness_providers",
            data,
            targetId: existing.id,
        });

        if (!res.success) {
            throw new Error(`Couldn't save the provider: ${res.msg}`);
        }

        return (await grabHarnessProviders({ provider_id: existing.id }))[0]!;
    }

    const res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_HARNESS_PROVIDERS,
        (typeof BunSQLiteTables)[number]
    >({
        table: "harness_providers",
        data: [data],
    });

    const new_id = res.singleRes?.id || res.postInsertReturn?.insertId;

    if (!res.success || !new_id) {
        throw new Error(`Couldn't add the provider: ${res.msg}`);
    }

    return (await grabHarnessProviders({ provider_id: new_id }))[0]!;
}
