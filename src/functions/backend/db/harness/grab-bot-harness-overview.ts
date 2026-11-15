import { Harnesses } from "@/src/dict/harness-dict";
import type { BotHarnessOverviewPayload } from "@/src/types";
import grabHarnessModelEntries from "./grab-harness-model-entries";
import grabHarnessOverviewItem from "./grab-harness-overview-item";
import grabHarnessSetting from "./grab-harness-setting";
import type { HarnessSettingSource } from "./pick-harness-setting-row";

/**
 * Only what a bot or workspace may set: install-wide harnesses are the
 * defaults' alone.
 */
const OwnHarnesses = Harnesses.filter((harness) => !harness.install_wide);

type Params = {
    /**
     * A worker bot the caller has checked belongs to the session user. Its
     * own models are what the form edits; in a workspace the workspace's
     * are what it inherits.
     */
    bot_id?: number;
    /**
     * A workspace the caller has checked belongs to the session user. With
     * no bot, the form edits the workspace's own models; with a bot, the
     * workspace's are the bot's default there.
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
     * The setting the form edits: the bot's own when it names one, else
     * the workspace's own (or, on a workspace's page, the workspace's).
     */
    const own_context = { bot_id, workspace_id };
    /**
     * What the owner runs on without its own setting. A bot in a workspace
     * inherits the workspace's models; a workspace (or a bot outside one)
     * inherits the defaults.
     */
    const inherited_context = bot_id ? { workspace_id } : {};

    const own_source: HarnessSettingSource = bot_id ? "bot" : "workspace";

    const [own, defaults] = await Promise.all([
        Promise.all(
            OwnHarnesses.map((harness) =>
                grabHarnessSetting({ harness: harness.value, ...own_context }),
            ),
        ),
        Promise.all(
            OwnHarnesses.map((harness) =>
                grabHarnessSetting({ harness: harness.value, ...inherited_context }),
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
                        ...own_context,
                    }),
                    grabHarnessOverviewItem({
                        harness: setting.harness,
                        setting: defaults[index]!,
                        entries,
                        ...inherited_context,
                    }),
                ]);

                return {
                    ...item,
                    inherit: setting.source != own_source,
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