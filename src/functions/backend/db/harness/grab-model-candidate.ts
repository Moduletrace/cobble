import BunSQLite from "@moduletrace/bun-sqlite";
import type { BUN_SQLITE_COBBLE_HARNESS_MODELS } from "@/db/types/db";
import type { HarnessKind } from "@/src/dict/harness-dict";
import modelServesHarness from "@/src/harness/catalog/model-serves-harness";
import type { HarnessCandidate } from "@/src/harness/types";
import AppError from "@/src/utils/app-error";
import grabHarnessProviders from "./grab-harness-providers";
import harnessModelRowToCatalog from "./harness-model-row-to-catalog";
import resolveProviderConfig from "./resolve-provider-config";

type Params = {
    model_id: number;
    harness: HarnessKind;
};

/**
 * One catalog model as a candidate to call directly, whatever is saved
 * (e.g. to try it before picking it). Throws when it's gone, can't do the
 * harness's job, or its provider is off or has no usable key.
 */
export default async function grabModelCandidate({
    model_id,
    harness,
}: Params): Promise<HarnessCandidate> {
    const row = (
        await BunSQLite.sql<BUN_SQLITE_COBBLE_HARNESS_MODELS>({
            sql: `SELECT * FROM harness_models WHERE id = ? AND available = 1`,
            values: [model_id],
        })
    ).payload?.[0];

    if (!row?.provider_id) {
        throw new AppError(`That model isn't available any more.`);
    }

    const model = harnessModelRowToCatalog({ row });

    if (!modelServesHarness({ model, harness })) {
        throw new AppError(`That model can't do this.`);
    }

    const [provider] = await grabHarnessProviders({
        provider_id: row.provider_id,
        enabled_only: true,
    });

    if (!provider) {
        throw new AppError(`That model's provider is turned off.`);
    }

    const { config, usable } = await resolveProviderConfig({ provider });

    if (!usable) {
        throw new AppError(`That model's provider has no usable key.`);
    }

    return {
        key: `${row.provider_id}:${model.slug}`,
        provider: config,
        model,
        source: "pinned",
    };
}
