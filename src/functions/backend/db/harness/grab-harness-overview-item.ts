import type { HarnessKind } from "@/src/dict/harness-dict";
import { Harnesses } from "@/src/dict/harness-dict";
import modelServesHarness from "@/src/harness/catalog/model-serves-harness";
import resolveHarnessCandidates from "@/src/harness/resolve/resolve-harness-candidates";
import type { HarnessOverview } from "@/src/types";
import type { HarnessModelEntry } from "./grab-harness-model-entries";
import type { HarnessSetting } from "./grab-harness-setting";

type Params = {
    harness: HarnessKind;
    setting: HarnessSetting;
    entries: HarnessModelEntry[];
    /**
     * Resolve what runs now for this bot instead of the default.
     */
    bot_id?: number | string;
    workspace_id?: number | string;
};

/**
 * One harness as the model settings pages show it: its setting, the
 * models it can be set to, and the model it would use right now.
 */
export default async function grabHarnessOverviewItem({
    harness,
    setting,
    entries,
    bot_id,
    workspace_id,
}: Params): Promise<HarnessOverview> {
    const meta = Harnesses.find((h) => h.value == harness)!;
    const candidates = setting.enabled
        ? await resolveHarnessCandidates({ harness, bot_id, workspace_id }).catch(() => [])
        : [];
    const first = candidates[0];
    const serving = entries.filter(({ model }) => modelServesHarness({ model, harness }));
    const providers = [
        ...new Map(
            serving.map(({ option }) => [
                option.provider_id,
                { id: option.provider_id, name: option.provider_name },
            ]),
        ).values(),
    ];

    if (setting.provider_id && !providers.some((p) => p.id == setting.provider_id)) {
        providers.push({ id: setting.provider_id, name: "Unavailable provider" });
    }
    const current = first
        ? entries.find(({ row, model }) => `${row.provider_id}:${model.slug}` == first.key)
        : undefined;

    return {
        harness,
        title: meta.title,
        description: meta.description,
        required: meta.required,
        model_id: setting.model_id,
        provider_id: setting.provider_id,
        providers,
        fallback: setting.fallback,
        enabled: setting.enabled,
        options: setting.options,
        models: serving.map(({ option }) => option),
        current: current && first ? { ...current.option, source: first.source } : undefined,
        candidate_count: candidates.length,
    };
}
