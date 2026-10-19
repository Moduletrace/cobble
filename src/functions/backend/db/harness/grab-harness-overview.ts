import { Harnesses } from "@/src/dict/harness-dict";
import type { HarnessOverviewPayload } from "@/src/types";
import grabHarnessModelEntries from "./grab-harness-model-entries";
import grabHarnessOverviewItem from "./grab-harness-overview-item";
import grabHarnessProviders from "./grab-harness-providers";
import grabHarnessSetting from "./grab-harness-setting";
import toPublicHarnessProvider from "./to-public-harness-provider";

/**
 * Everything the Models settings page shows: the providers (without keys)
 * and, per harness, its default setting, the models it can be set to
 * (free first) and what it runs on right now.
 */
export default async function grabHarnessOverview(): Promise<HarnessOverviewPayload> {
    const providers = await grabHarnessProviders();
    const settings = await Promise.all(
        Harnesses.map((harness) => grabHarnessSetting({ harness: harness.value })),
    );
    const entries = await grabHarnessModelEntries({
        pinned_ids: settings.flatMap((setting) =>
            setting.model_id ? [setting.model_id] : [],
        ),
    });

    return {
        providers: providers.map((provider) => toPublicHarnessProvider({ provider })),
        harnesses: await Promise.all(
            settings.map((setting) =>
                grabHarnessOverviewItem({ harness: setting.harness, setting, entries }),
            ),
        ),
    };
}
