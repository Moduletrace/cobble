import type { TWUISelectOptionObject } from "@moduletrace/twui/form/Select";
import type { HarnessModelOption } from "@/src/types";

export const AutoModelValue = "auto";

type Params = {
    /**
     * The models to offer, already narrowed to the picked provider.
     */
    models: HarnessModelOption[];
    model_id: number | null;
    /**
     * The picked provider's name; undefined for any provider.
     */
    provider_name?: string;
    /**
     * False: there's no automatic pick, so the empty choice reads "Not
     * available".
     */
    automatic: boolean;
};

/**
 * The model picker's options: automatic (the best free model, on the
 * picked provider if there is one), then every model that can do the job
 * (free ones first, as the server sorts them). A harness without
 * automatic picks starts with "Not available" instead.
 */
export default function harnessModelSelectOptions({
    models,
    model_id,
    provider_name,
    automatic,
}: Params): TWUISelectOptionObject[] {
    const has_free = models.some((model) => model.free);

    return [
        {
            value: AutoModelValue,
            title: !automatic
                ? "Not available (pick a model to turn it on)"
                : provider_name
                ? has_free
                    ? `Automatic (best free model on ${provider_name})`
                    : `Automatic (no free models on ${provider_name}: pick one)`
                : "Automatic (best free model)",
            default: !model_id,
        },
        ...models.map((model) => ({
            value: String(model.id),
            title: `${model.name}${provider_name ? "" : ` · ${model.provider_name}`}${model.free && !/free/i.test(model.name) ? " · free" : ""}`,
            default: model.id == model_id,
        })),
    ];
}
