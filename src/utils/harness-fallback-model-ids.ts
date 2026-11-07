import { AppData } from "@/src/data/app-data";

type Params = {
    /**
     * A harness setting's options.
     */
    options?: Record<string, unknown>;
};

/**
 * The fallback models a text harness setting tries, in order, after its
 * pick and before the automatic picks (`fallback_model_ids`): distinct
 * positive `harness_models` ids, at most
 * `AppData.HarnessTextFallbackModelsMax`. Anything else in the options is
 * ignored.
 */
export default function harnessFallbackModelIds({ options }: Params): number[] {
    const raw = options?.fallback_model_ids;

    if (!Array.isArray(raw)) return [];

    const ids: number[] = [];

    for (const value of raw) {
        const id = Number(value);

        if (Number.isInteger(id) && id > 0 && !ids.includes(id)) ids.push(id);
    }

    return ids.slice(0, AppData.HarnessTextFallbackModelsMax);
}
