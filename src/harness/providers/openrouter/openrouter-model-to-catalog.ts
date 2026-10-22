import type { HarnessCatalogModel } from "../../types";

/**
 * One entry of OpenRouter's `/models` list (the fields the harness reads).
 */
export type OpenRouterModel = {
    id: string;
    name?: string;
    created?: number;
    context_length?: number | null;
    architecture?: {
        input_modalities?: string[] | null;
        output_modalities?: string[] | null;
    } | null;
    supported_parameters?: string[] | null;
    supported_voices?: string[] | null;
    top_provider?: {
        max_completion_tokens?: number | null;
    } | null;
    expiration_date?: string | null;
    benchmarks?: {
        artificial_analysis?: {
            intelligence_index?: number | null;
            agentic_index?: number | null;
        } | null;
    } | null;
};

type Params = {
    model: OpenRouterModel;
};

/**
 * Maps an OpenRouter model to a catalog entry. Free means a `:free` model
 * or the `openrouter/free` router: other models can show zero token
 * prices and still bill per request, second or image.
 */
export default function openRouterModelToCatalog({
    model,
}: Params): HarnessCatalogModel {
    const scores = model.benchmarks?.artificial_analysis;
    const expires_at = model.expiration_date
        ? Date.parse(model.expiration_date)
        : NaN;

    return {
        slug: model.id,
        name: model.name || model.id,
        free: model.id.endsWith(":free") || model.id == "openrouter/free",
        input_modalities: model.architecture?.input_modalities || ["text"],
        output_modalities: model.architecture?.output_modalities || ["text"],
        supports_tools: Boolean(model.supported_parameters?.includes("tools")),
        context_length: model.context_length || undefined,
        max_output_tokens:
            model.top_provider?.max_completion_tokens || undefined,
        voices: model.supported_voices?.length
            ? model.supported_voices
            : undefined,
        supported_parameters: model.supported_parameters?.length
            ? model.supported_parameters
            : undefined,
        released_at: model.created ? model.created * 1000 : undefined,
        expires_at: Number.isNaN(expires_at) ? undefined : expires_at,
        intelligence_score: scores?.intelligence_index ?? undefined,
        agentic_score: scores?.agentic_index ?? undefined,
    };
}
