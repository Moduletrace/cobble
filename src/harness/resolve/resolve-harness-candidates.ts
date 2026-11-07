import BunSQLite from "@moduletrace/bun-sqlite";
import type {
    BUN_SQLITE_COBBLE_HARNESS_MODELS,
    BUN_SQLITE_COBBLE_HARNESS_PROVIDERS,
} from "@/db/types/db";
import { Harnesses, type HarnessKind } from "@/src/dict/harness-dict";
import grabHarnessProviders from "@/src/functions/backend/db/harness/grab-harness-providers";
import grabHarnessSetting from "@/src/functions/backend/db/harness/grab-harness-setting";
import harnessModelRowToCatalog from "@/src/functions/backend/db/harness/harness-model-row-to-catalog";
import resolveProviderConfig from "@/src/functions/backend/db/harness/resolve-provider-config";
import modelServesHarness from "../catalog/model-serves-harness";
import rankAutoModels from "../catalog/rank-auto-models";
import harnessFallbackModelIds from "@/src/utils/harness-fallback-model-ids";
import HarnessError from "../harness-error";
import type {
    HarnessCandidate,
    HarnessCatalogModel,
    HarnessProviderConfig,
} from "../types";

type Params = {
    harness: HarnessKind;
    /**
     * The bot the call is for: a worker bot can override the default.
     */
    bot_id?: number | string;
    /**
     * The workspace the call is in: its models win over the bot's.
     */
    workspace_id?: number | string | null;
};

type CatalogEntry = HarnessCatalogModel & {
    row_id: number;
    provider: HarnessProviderConfig;
};

/**
 * The models a harness call tries, in order: the pick (the workspace's,
 * the bot's own, else the super admin's), then the setting's fallback
 * models in their order (`fallback_model_ids`, each on its own provider),
 * then (if it has fallback on, or there is no pick) the automatic free
 * picks. Only enabled providers with a usable key count, and only the
 * setting's provider for the pick and automatic picks when it has one.
 * Empty when nothing is set up; throws `unavailable` when the harness is
 * turned off.
 */
export default async function resolveHarnessCandidates({
    harness,
    bot_id,
    workspace_id,
}: Params): Promise<HarnessCandidate[]> {
    const setting = await grabHarnessSetting({ harness, bot_id, workspace_id });

    if (!setting.enabled) {
        const title = Harnesses.find((h) => h.value == harness)?.title;

        throw new HarnessError({
            message:
                setting.source == "bot"
                    ? `${title} is turned off for this bot. Turn it on in the bot's model settings.`
                    : `${title} is turned off. A super admin can turn it on in Settings, under Models.`,
            code: "unavailable",
        });
    }

    const providers = await grabUsableProviders();

    if (!providers.size) return [];

    const fallback_ids = harnessFallbackModelIds({ options: setting.options }).filter(
        (id) => id != setting.model_id,
    );
    const picked_ids = [setting.model_id ?? 0, ...fallback_ids];

    const rows =
        (
            await BunSQLite.sql<BUN_SQLITE_COBBLE_HARNESS_MODELS>({
                sql: `SELECT * FROM harness_models
                    WHERE available = 1 AND (free = 1 OR id IN (${picked_ids.map(() => "?").join(", ")}))`,
                values: picked_ids,
            })
        ).payload || [];

    const toEntry = ({ row, any_provider }: { row: BUN_SQLITE_COBBLE_HARNESS_MODELS; any_provider: boolean }) => {
        const provider =
            row.provider_id && (any_provider || !setting.provider_id || row.provider_id == setting.provider_id)
                ? providers.get(row.provider_id)
                : undefined;

        return provider && row.id
            ? [{ ...harnessModelRowToCatalog({ row }), row_id: row.id, provider }]
            : [];
    };

    const entries: CatalogEntry[] = rows.flatMap((row) => toEntry({ row, any_provider: false }));

    const pinned = entries.find(
        (entry) =>
            entry.row_id == setting.model_id &&
            modelServesHarness({ model: entry, harness }),
    );

    /**
     * Each fallback model names its own provider, so the setting's
     * provider limit doesn't apply to them.
     */
    const fallbacks: CatalogEntry[] = fallback_ids.flatMap((id) => {
        const row = rows.find((r) => r.id == id);

        return row
            ? toEntry({ row, any_provider: true }).filter((entry) => modelServesHarness({ model: entry, harness }))
            : [];
    });

    const ordered = [
        ...(pinned ? [{ entry: pinned, source: "pinned" as const }] : []),
        ...fallbacks.map((entry) => ({ entry, source: "fallback" as const })),
        ...(!pinned || setting.fallback
            ? rankAutoModels({ models: entries, harness }).map((entry) => ({
                  entry,
                  source: "auto" as const,
              }))
            : []),
    ];

    const seen = new Set<string>();

    return ordered.flatMap(({ entry, source }) => {
        const key = `${entry.provider.id}:${entry.slug}`;

        if (seen.has(key)) return [];
        seen.add(key);

        return [{ key, provider: entry.provider, model: entry, source }];
    });
}

async function grabUsableProviders() {
    const rows: BUN_SQLITE_COBBLE_HARNESS_PROVIDERS[] =
        await grabHarnessProviders({ enabled_only: true });
    const usable = new Map<number, HarnessProviderConfig>();

    for (const row of rows) {
        const { config, usable: is_usable } = await resolveProviderConfig({
            provider: row,
        });

        if (row.id && is_usable) usable.set(row.id, config);
    }

    return usable;
}
