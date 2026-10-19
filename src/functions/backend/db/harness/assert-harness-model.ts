import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_HARNESS_MODELS } from "@/db/types/db";
import type { HarnessKind } from "@/src/dict/harness-dict";
import modelServesHarness from "@/src/harness/catalog/model-serves-harness";
import AppError from "@/src/utils/app-error";
import harnessModelRowToCatalog from "./harness-model-row-to-catalog";

type Params = {
    harness: HarnessKind;
    model_id: number;
    /**
     * The provider the setting is limited to, if any.
     */
    provider_id?: number | null;
};

/**
 * Throws unless the model is available, can do the harness's job and,
 * when the setting is limited to a provider, comes from it.
 */
export default async function assertHarnessModel({ harness, model_id, provider_id }: Params) {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_HARNESS_MODELS>({
            sql: `SELECT * FROM harness_models WHERE id = ? AND available = 1 LIMIT 1`,
            values: [model_id],
        })
    ).payload?.[0];

    if (!row) {
        throw new AppError(`That model isn't available anymore.`);
    }

    if (provider_id && row.provider_id != provider_id) {
        throw new AppError(`That model isn't from the picked provider.`);
    }

    if (!modelServesHarness({ model: harnessModelRowToCatalog({ row }), harness })) {
        throw new AppError(`That model can't do this job.`);
    }
}
