import type { HarnessFormValue } from "@/src/types";

type Params = {
    /**
     * The current harness form state before the provider selection change.
     */
    value: HarnessFormValue;
    /**
     * The new provider id and inherit state selected by the user.
     */
    next: { provider_id: number | null; inherit: boolean };
    /**
     * The provider id of the currently picked model, if any.
     */
    picked_provider_id?: number | null;
};

/**
 * Calculates the next harness form value when the model provider changes.
 *
 * When the provider changes (including switching between specific providers,
 * 'any provider', or inherit mode), fallback models are reset to empty to avoid
 * retaining fallback models from the previous provider configuration.
 *
 * The selected model is also cleared if a specific provider is chosen and the
 * currently picked model does not belong to that provider.
 */
export default function nextHarnessProviderValue({
    value,
    next,
    picked_provider_id,
}: Params): HarnessFormValue {
    // Detect whether the provider selection or inherit mode actually changed
    const provider_changed =
        next.provider_id != value.provider_id ||
        Boolean(next.inherit) != Boolean(value.inherit);

    // If a specific provider was selected and the picked model does not belong to it, clear the model
    const should_clear_model = Boolean(
        next.provider_id && picked_provider_id != next.provider_id,
    );

    return {
        ...value,
        ...next,
        // Reset the model if it is invalid under the newly selected provider
        model_id: should_clear_model ? null : value.model_id,
        // Reset fallback models when the provider changes
        fallback_model_ids: provider_changed ? [] : (value.fallback_model_ids || []),
        // Voice is cleared on provider change as voices are provider/model-specific
        voice: undefined,
    };
}
