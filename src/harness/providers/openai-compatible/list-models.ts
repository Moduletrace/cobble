import guessModelModalities from "../../catalog/guess-model-modalities";
import type { HarnessAdapter, HarnessCatalogModel } from "../../types";
import grabProviderPreset from "../grab-provider-preset";
import openRouterModelToCatalog, {
    type OpenRouterModel,
} from "../openrouter/openrouter-model-to-catalog";
import providerRequest from "./provider-request";

/**
 * The provider's models. OpenRouter's list is complete (every output
 * modality, with capabilities and benchmarks); other providers list ids,
 * and capabilities are guessed from them. A local provider's models are
 * all free.
 */
const listModels: HarnessAdapter["listModels"] = async ({
    provider,
    signal,
}) => {
    const preset = grabProviderPreset({ kind: provider.kind });
    const is_openrouter = preset.catalog == "openrouter";

    const res = await providerRequest({
        provider,
        path: is_openrouter ? "/models?output_modalities=all" : "/models",
        method: "GET",
        signal,
    });

    const json = await res.json().catch(() => null);
    const items: any[] = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json?.models)
          ? json.models
          : [];

    if (is_openrouter) {
        return items
            .filter((item) => typeof item?.id == "string")
            .map((item: OpenRouterModel) =>
                openRouterModelToCatalog({ model: item }),
            );
    }

    return items
        .map((item) => (typeof item == "string" ? item : item?.id))
        .filter((slug): slug is string => typeof slug == "string" && !!slug)
        .map(
            (slug): HarnessCatalogModel => ({
                slug,
                name: slug,
                free: preset.local,
                ...guessModelModalities({ slug }),
            }),
        );
};

export default listModels;
