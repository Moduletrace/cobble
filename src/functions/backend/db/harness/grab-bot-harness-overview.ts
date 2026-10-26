import { Harnesses } from "@/src/dict/harness-dict";

/**
 * Only what a bot or workspace may set: install-wide harnesses are the
 * defaults' alone.
 */
const OwnHarnesses = Harnesses.filter((harness) => !harness.install_wide);
import type { BotHarnessOverviewPayload } from "@/src/types";
import grabHarnessModelEntries from "./grab-harness-model-entries";
import grabHarnessOverviewItem from "./grab-harness-overview-item";
import grabHarnessSetting from "./grab-harness-setting";

type Params = {
    /**
     * A worker bot the caller has checked belongs to the session user.
     */
    bot_id?: number;
    /**
     * A workspace the caller has checked belongs to the session user. Then
     * the settings shown are the workspace's own, over what it inherits:
     * the bot's (when given) or the defaults.
     */
    workspace_id?: number;
};

/**
 * A worker bot's (or a workspace's) model settings: per harness, its own
 * setting (or what it inherits), the models it can pick, what it runs on
 * now, and what it would run on without its own setting. Install-wide
 * harnesses (embeddings) aren't listed.
 */
export default async function grabBotHarnessOverview({
    bot_id,
    workspace_id,
}: Params): Promise<BotHarnessOverviewPayload> {
    /**
     * In a workspace, "the default" is what a run there gets without the
     * workspace's own setting: the bot's, else the defaults.
     */
    const inherited_bot_id = workspace_id ? bot_id : undefined;

    const [own, defaults] = await Promise.all([
        Promise.all(
            OwnHarnesses.map((harness) =>
                grabHarnessSetting({
                    harness: harness.value,
                    bot_id: workspace_id ? undefined : bot_id,
                    workspace_id,
                }),
            ),
        ),
        Promise.all(
            OwnHarnesses.map((harness) =>
                grabHarnessSetting({ harness: harness.value, bot_id: inherited_bot_id }),
            ),
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
                    grabHarnessOverviewItem({
                        harness: setting.harness,
                        setting,
                        entries,
                        bot_id,
                        workspace_id,
                    }),
                    grabHarnessOverviewItem({
                        harness: setting.harness,
                        setting: defaults[index]!,
                        entries,
                        bot_id: inherited_bot_id,
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
