import type { TWUISelectOptionObject } from "@moduletrace/twui/form/Select";
import type { HarnessModelOption } from "@/src/types";

export const NoFallbackValue = "none";

type Params = {
    /**
     * Every model that can do the job, on any provider.
     */
    models: HarnessModelOption[];
    /**
     * This slot's model, if any.
     */
    model_id?: number;
    /**
     * The pick and the other slots' models, left out here.
     */
    taken: number[];
};

/**
 * One fallback slot's options: none, then every model that can do the
 * job on any provider (named with its provider), except the ones already
 * picked elsewhere.
 */
export default function harnessFallbackModelOptions({ models, model_id, taken }: Params): TWUISelectOptionObject[] {
    return [
        { value: NoFallbackValue, title: "None", default: !model_id },
        ...models
            .filter((model) => model.id == model_id || !taken.includes(model.id))
            .map((model) => ({
                value: String(model.id),
                title: `${model.name} · ${model.provider_name}${model.free && !/free/i.test(model.name) ? " · free" : ""}`,
                default: model.id == model_id,
            })),
    ];
}
