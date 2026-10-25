import type { HarnessCallSettings } from "@/src/harness/usage/types";

type SettingsSource = NonNullable<HarnessCallSettings["settings_source"]>;

const SettingsSources: SettingsSource[] = ["default", "bot", "workspace"];

type Params = {
    /**
     * `token_usages.settings`, as stored.
     */
    json?: string | null;
};

/**
 * A call's stored settings (`HarnessCallSettings`), or null for a call
 * recorded before they were, or one that doesn't parse. Only the known
 * fields of the right type are kept.
 */
export default function parseCallSettings({ json }: Params): HarnessCallSettings | null {
    if (!json) return null;

    let raw: unknown;

    try {
        raw = JSON.parse(json);
    } catch {
        return null;
    }

    if (!raw || typeof raw != "object") return null;

    const value = raw as Record<string, unknown>;
    const params = value.params && typeof value.params == "object" ? (value.params as Record<string, unknown>) : null;
    const kept_params = Object.fromEntries(
        Object.entries(params || {}).filter(([, v]) => typeof v == "number" || typeof v == "string"),
    ) as Record<string, number | string>;

    return {
        model_source: value.model_source == "pinned" ? "pinned" : "auto",
        ...(SettingsSources.includes(value.settings_source as SettingsSource)
            ? { settings_source: value.settings_source as SettingsSource }
            : {}),
        ...(Object.keys(kept_params).length ? { params: kept_params } : {}),
        ...(typeof value.max_tokens == "number" ? { max_tokens: value.max_tokens } : {}),
        ...(typeof value.voice == "string" && value.voice ? { voice: value.voice } : {}),
        ...(Array.isArray(value.fell_back_from)
            ? { fell_back_from: value.fell_back_from.filter((k): k is string => typeof k == "string") }
            : {}),
    };
}
