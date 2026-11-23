import type { TWUISelectOptionObject } from "@moduletrace/twui/form/Select";
import type { HarnessModelOption } from "@/src/types";

type Params = {
    /**
     * Every model that can do the job, on any provider.
     */
    models: HarnessModelOption[];
    /**
     * The model picked in this picker, if any.
     */
    model_id?: number;
    /**
     * The pick and the backups already saved, left out here.
     */
    taken: number[];
};

/**
 * A backup picker's options: every model that can do the job on any
 * provider (named with its provider), except the ones taken elsewhere.
 */
export default function harnessFallbackModelOptions({ models, model_id, taken }: Params): TWUISelectOptionObject[] {
    return models
        .filter((model) => !taken.includes(model.id))
        .map((model) => ({
            value: String(model.id),
            title: `${model.name} · ${model.provider_name}${model.free && !/free/i.test(model.name) ? " · free" : ""}`,
            default: model.id == model_id,
        }));
}