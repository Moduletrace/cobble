import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_HARNESS_MODELS } from "@/db/types/db";
import type { HarnessCatalogModel } from "@/src/harness/types";
import type { HarnessModelOption } from "@/src/types";
import harnessModelRowToCatalog from "./harness-model-row-to-catalog";

type Params = {
    /**
     * Picked models, listed even when no longer available.
     */
    pinned_ids?: number[];
};

type ModelRow = BUN_SQLITE_COBBLE_HARNESS_MODELS & { provider_name?: string };

export type HarnessModelEntry = {
    row: ModelRow;
    model: HarnessCatalogModel;
    option: HarnessModelOption;
};

/**
 * Every model a setting can pick (available, on an enabled provider),
 * free first, plus the given picked ones, each with its picker option.
 */
export default async function grabHarnessModelEntries({
    pinned_ids = [],
}: Params = {}): Promise<HarnessModelEntry[]> {
    const ids = [...new Set(pinned_ids)];

    const rows =
        (
            await BunSQLite.sql<ModelRow>({
                sql: `SELECT m.*, p.name AS provider_name FROM harness_models m
                    JOIN harness_providers p ON p.id = m.provider_id
                    WHERE (m.available = 1 AND p.enabled = 1)
                    ${ids.length ? `OR m.id IN (${ids.map(() => "?").join(", ")})` : ""}
                    ORDER BY m.free DESC, p.id ASC, m.name ASC`,
                values: ids,
            })
        ).payload || [];

    return rows.map((row) => {
        const model = harnessModelRowToCatalog({ row });

        return {
            row,
            model,
            option: {
                id: row.id || 0,
                provider_id: row.provider_id || 0,
                provider_name: row.provider_name || "",
                slug: model.slug,
                name: `${model.name || model.slug}${row.available == 0 ? " (no longer listed)" : ""}`,
                free: model.free,
                voices: model.voices,
                supported_parameters: model.supported_parameters,
            },
        };
    });
}
