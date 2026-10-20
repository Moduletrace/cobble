import type {
    HarnessCatalog,
    HarnessOverview,
    HarnessSettingOverview,
} from "@/src/types";

type Harnesses = {
    harnesses: HarnessOverview[];
};

/**
 * The install-wide part of a model overview: everything except the bot's
 * own settings.
 */
export function harnessCatalogFromOverview({ harnesses }: Harnesses): HarnessCatalog[] {
    return harnesses.map(({ harness, title, description, required, automatic, providers, models }) => ({
        harness,
        title,
        description,
        required,
        automatic,
        providers,
        models,
    }));
}

/**
 * A bot's (or workspace's) part of a model overview: the settings, what
 * runs now, and what the default runs on. A picked model or provider the
 * catalog no longer lists travels with it, so it isn't lost.
 */
export function harnessSettingsFromOverview({ harnesses }: Harnesses): HarnessSettingOverview[] {
    return harnesses.map(({ title, description, required, automatic, providers, models, ...setting }) => {
        const pinned_model = setting.model_id
            ? models.find((model) => model.id == setting.model_id)
            : undefined;
        const unavailable_provider =
            setting.provider_id && !providers.some((provider) => provider.id == setting.provider_id)
                ? { id: setting.provider_id, name: "Unavailable provider" }
                : undefined;

        return {
            ...setting,
            ...(pinned_model ? { pinned_model } : {}),
            ...(unavailable_provider ? { unavailable_provider } : {}),
        };
    });
}

/**
 * A catalog and a conversation's settings as the models form wants them:
 * the catalog's list of models and providers under the setting. Undefined
 * until both parts are there.
 */
export function mergeHarnessOverview({
    catalog,
    settings,
}: {
    catalog?: HarnessCatalog[] | null;
    settings?: HarnessSettingOverview[] | null;
}): HarnessOverview[] | undefined {
    if (!catalog?.length || !settings?.length) return undefined;

    const by_harness = new Map(catalog.map((entry) => [entry.harness, entry]));

    return settings.flatMap((setting) => {
        const entry = by_harness.get(setting.harness);

        if (!entry) return [];

        const { pinned_model, unavailable_provider, ...rest } = setting;
        const models =
            pinned_model && !entry.models.some((model) => model.id == pinned_model.id)
                ? [...entry.models, pinned_model]
                : entry.models;
        const providers =
            unavailable_provider &&
            !entry.providers.some((provider) => provider.id == unavailable_provider.id)
                ? [...entry.providers, unavailable_provider]
                : entry.providers;

        return [{ ...entry, ...rest, models, providers }];
    });
}
