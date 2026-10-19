import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_HARNESS_PROVIDERS } from "@/db/types/db";
import { DefaultHarnessProviderKind } from "@/src/dict/harness-provider-dict";

/**
 * The default provider (`DefaultHarnessProviderKind`, OpenRouter): the
 * oldest enabled one of that kind. Undefined once it's removed or turned
 * off, which leaves harnesses on any provider.
 */
export default async function grabDefaultHarnessProviderId() {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_HARNESS_PROVIDERS>({
            sql: `SELECT id FROM harness_providers WHERE kind = ? AND enabled = 1 ORDER BY id ASC LIMIT 1`,
            values: [DefaultHarnessProviderKind],
        })
    ).payload?.[0];

    return row?.id || undefined;
}
