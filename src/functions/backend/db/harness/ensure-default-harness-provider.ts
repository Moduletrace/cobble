import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_HARNESS_PROVIDERS,
    BunSQLiteTables,
} from "@/db/types/db";
import { DefaultHarnessProviderKind } from "@/src/dict/harness-provider-dict";
import grabProviderPreset from "@/src/harness/providers/grab-provider-preset";

/**
 * Adds the default provider (OpenRouter) when no provider exists, so the
 * free models work as soon as a key is set. Idempotent; a super admin who
 * removed it and added others doesn't get it back.
 */
export default async function ensureDefaultHarnessProvider() {
    const existing = await BunSQLite.sql<BUN_SQLITE_COBBLE_HARNESS_PROVIDERS>({
        sql: `SELECT id FROM harness_providers LIMIT 1`,
    });

    if (existing.payload?.[0]) return;

    const preset = grabProviderPreset({ kind: DefaultHarnessProviderKind });

    const res = await BunSQLite.insert<
        BUN_SQLITE_COBBLE_HARNESS_PROVIDERS,
        (typeof BunSQLiteTables)[number]
    >({
        table: "harness_providers",
        data: [
            {
                kind: preset.value,
                name: preset.title,
                base_url: preset.base_url,
                enabled: 1,
            },
        ],
    });

    if (!res.success) {
        throw new Error(`Couldn't add the default model provider: ${res.msg}`);
    }
}
