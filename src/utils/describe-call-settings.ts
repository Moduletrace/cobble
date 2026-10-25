import { HarnessParameterHarnesses, HarnessParameters } from "@/src/dict/harness-parameter-dict";
import type { HarnessCallSettings } from "@/src/harness/usage/types";

const SettingsSources: Record<NonNullable<HarnessCallSettings["settings_source"]>, string> = {
    default: "The install's defaults",
    bot: "The bot's own",
    workspace: "The workspace's",
};

type Params = {
    settings: HarnessCallSettings;
    /**
     * Generation settings only apply to the chat harnesses.
     */
    harness: string;
};

/**
 * A call's settings as label and value pairs, in the order Settings,
 * under Models, lists them: the model's pick, whose settings they were,
 * every generation setting sent (by its title), then the token limit, the
 * voice and any models that failed before it.
 */
export default function describeCallSettings({ settings, harness }: Params) {
    const chat = (HarnessParameterHarnesses as readonly string[]).includes(harness);
    const rows: { label: string; value: string }[] = [
        { label: "Model pick", value: settings.model_source == "pinned" ? "Picked in the settings" : "Automatic" },
    ];

    if (settings.settings_source) {
        rows.push({ label: "Settings from", value: SettingsSources[settings.settings_source] });
    }

    for (const [key, value] of Object.entries(settings.params || {})) {
        const parameter = HarnessParameters.find((p) => p.key == key);
        const option =
            parameter && "options" in parameter ? parameter.options.find((o) => o.value == value) : undefined;

        rows.push({ label: parameter?.title || key, value: option?.title || String(value) });
    }

    if (chat && (!settings.params || !Object.keys(settings.params).length)) {
        rows.push({ label: "Generation", value: "The provider's defaults" });
    }

    if (settings.max_tokens) rows.push({ label: "Max tokens", value: settings.max_tokens.toLocaleString() });
    if (settings.voice) rows.push({ label: "Voice", value: settings.voice });

    if (settings.fell_back_from?.length) {
        rows.push({
            label: "Fell back from",
            value: settings.fell_back_from.map((key) => key.slice(key.indexOf(":") + 1)).join(", "),
        });
    }

    return rows;
}
