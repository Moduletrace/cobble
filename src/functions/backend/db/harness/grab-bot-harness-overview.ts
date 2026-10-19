import { Harnesses } from "@/src/dict/harness-dict";
import type { BotHarnessOverviewPayload } from "@/src/types";
import grabHarnessModelEntries from "./grab-harness-model-entries";
import grabHarnessOverviewItem from "./grab-harness-overview-item";
import grabHarnessSetting from "./grab-harness-setting";

type Params = {
    /**
     * A worker bot the caller has checked belongs to the session user.
     */
    bot_id: number;
};

/**
 * A worker bot's model settings page: per harness, the bot's own setting
 * (or the default it inherits), the models it can pick, what it runs on
 * now, and what the default runs on.
 */
export default async function grabBotHarnessOverview({
    bot_id,
}: Params): Promise<BotHarnessOverviewPayload> {
    const [own, defaults] = await Promise.all([
        Promise.all(
            Harnesses.map((harness) => grabHarnessSetting({ harness: harness.value, bot_id })),
        ),
        Promise.all(
            Harnesses.map((harness) => grabHarnessSetting({ harness: harness.value })),
        ),
    ]);

    const entries = await grabHarnessModelEntries({
        pinned_ids: [...own, ...defaults].flatMap((setting) =>
            setting.model_id ? [setting.model_id] : [],
        ),
    });

    return {
        harnesses: await Promise.all(
            own.map(async (setting, index) => {
                const [item, default_item] = await Promise.all([
                    grabHarnessOverviewItem({ harness: setting.harness, setting, entries, bot_id }),
                    grabHarnessOverviewItem({
                        harness: setting.harness,
                        setting: defaults[index]!,
                        entries,
                    }),
                ]);

                return {
                    ...item,
                    inherit: setting.source == "default",
                    default: {
                        enabled: default_item.enabled,
                        current: default_item.current,
                        candidate_count: default_item.candidate_count,
                    },
                };
            }),
        ),
    };
}
