import type { HarnessCatalogModel } from "@/src/harness/types";

type Params = {
    model: Pick<HarnessCatalogModel, "supported_parameters">;
    /**
     * The names the provider's own row declares, for the models it lists
     * without any (a custom provider lists ids only).
     */
    provider_parameters?: string[] | null;
};

/**
 * The parameters a `harness_models` row keeps: what the provider's own list
 * said, else the settings the provider declares (its preset, its host or a
 * super admin's pick). A model's own list wins, so OpenRouter's catalog is
 * never overridden.
 */
export default function modelSupportedParameters({
    model,
    provider_parameters,
}: Params) {
    return model.supported_parameters ?? provider_parameters ?? null;
}