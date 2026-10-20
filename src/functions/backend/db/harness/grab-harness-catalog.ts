import { Harnesses } from "@/src/dict/harness-dict";
import modelServesHarness from "@/src/harness/catalog/model-serves-harness";
import type {
    HarnessCatalogPayload,
    HarnessProviderChoice,
} from "@/src/types";
import grabHarnessModelEntries from "./grab-harness-model-entries";

/**
 * Every harness's install-wide catalog: what it is for, the providers with
 * a model that can do the job, and those models. One copy serves every
 * bot and workspace, so the models modal caches it once per user.
 */
export default async function grabHarnessCatalog(): Promise<HarnessCatalogPayload> {
    const entries = await grabHarnessModelEntries();

    return {
        harnesses: Harnesses.map(({ value, title, description, required, automatic }) => {
            const serving = entries.filter(({ model }) =>
                modelServesHarness({ model, harness: value }),
            );

            const providers: HarnessProviderChoice[] = [
                ...new Map(
                    serving.map(({ option }) => [
                        option.provider_id,
                        { id: option.provider_id, name: option.provider_name },
                    ]),
                ).values(),
            ];

            return {
                harness: value,
                title,
                description,
                required,
                automatic,
                providers,
                models: serving.map(({ option }) => option),
            };
        }),
    };
}
