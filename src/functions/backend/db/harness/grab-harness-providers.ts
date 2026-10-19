import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_HARNESS_PROVIDERS } from "@/db/types/db";

type Params = {
    provider_id?: number | string;
    enabled_only?: boolean;
};

/**
 * Provider rows, oldest first. They hold the encrypted key: server only,
 * never hand them to the client as they are (`toPublicHarnessProvider`).
 */
export default async function grabHarnessProviders({
    provider_id,
    enabled_only,
}: Params = {}) {
    const where: string[] = [];
    const values: (string | number)[] = [];

    if (provider_id) {
        where.push(`id = ?`);
        values.push(provider_id);
    }

    if (enabled_only) {
        where.push(`enabled = 1`);
    }

    const res = await BunSQLite.sql<BUN_SQLITE_COBBLE_HARNESS_PROVIDERS>({
        sql: `SELECT * FROM harness_providers ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY id ASC`,
        values,
    });

    return res.payload || [];
}
