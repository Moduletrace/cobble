import type { HarnessCatalogModel } from "@/src/harness/types";

type Params = {
    model: Pick<HarnessCatalogModel, "context_length">;
    /**
     * The window the provider's own row declares, for the models it lists
     * without one.
     */
    provider_context_length?: number | null;
};

/**
 * The window a `harness_models` row keeps, in tokens: what the provider's
 * own list said, else the window the super admin declared for that provider
 * (a custom provider lists ids only), else nothing, and the run assumes
 * `AppData.HarnessUnknownContextWindow`.
 */
export default function modelContextLength({
    model,
    provider_context_length,
}: Params) {
    return model.context_length || provider_context_length || null;
}