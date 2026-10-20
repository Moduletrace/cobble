import type { BotHarnessSettingsPayload, HarnessSettingOverview } from "@/src/types";
import grabBotHarnessOverview from "./grab-bot-harness-overview";
import grabHarnessOverview from "./grab-harness-overview";

type Params = {
    /**
     * A bot the caller has checked the session user chats with there.
     */
    bot: { id?: number; kind?: string | null };
    workspace_id?: number | null;
};

/**
 * What a conversation's models form edits, without the install-wide
 * catalog: a worker's own settings, or for the coordinator the defaults it
 * runs on. In a workspace the workspace's own models come first, so what
 * runs now shows its pick.
 */
export default async function grabConversationHarnessSettings({
    bot,
    workspace_id,
}: Params): Promise<BotHarnessSettingsPayload> {
    const overview =
        bot.kind == "coordinator" && !workspace_id
            ? { harnesses: (await grabHarnessOverview()).harnesses }
            : await grabBotHarnessOverview({
                  bot_id: bot.kind == "coordinator" ? undefined : bot.id,
                  workspace_id: workspace_id || undefined,
              });

    return { harnesses: overview.harnesses.map(stripCatalog) };
}

/**
 * A harness overview item without the models and providers the catalog
 * already carries. A picked model or provider the catalog no longer lists
 * travels with the setting, so the form can still show it.
 */
function stripCatalog({
    title,
    description,
    required,
    automatic,
    providers,
    models,
    ...setting
}: (Awaited<ReturnType<typeof grabBotHarnessOverview>>)["harnesses"][number]): HarnessSettingOverview {
    const pinned_model = setting.model_id
        ? models.find((model) => model.id == setting.model_id)
        : undefined;
    const unavailable_provider =
        setting.provider_id && !providers.some((provider) => provider.id == setting.provider_id)
            ? { id: setting.provider_id, name: "Unavailable provider" }
            : undefined;

    return {
        ...setting,
        ...(pinned_model ? { pinned_model } : {}),
        ...(unavailable_provider ? { unavailable_provider } : {}),
    };
}
