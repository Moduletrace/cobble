import checkAppNetworks from "./check-app-networks";

type Params = {
    /**
     * The saved `app_extra_networks` setting.
     */
    value?: string | null;
};

/**
 * The saved extra networks, or none when the setting is missing or no
 * longer reads as a valid list.
 */
export default function parseAppNetworks({ value }: Params): string[] {
    if (!value) return [];

    try {
        const parsed: unknown = JSON.parse(value);

        if (!Array.isArray(parsed)) return [];

        const names = parsed.filter((name): name is string => typeof name == "string");

        return checkAppNetworks({ networks: names }).networks || [];
    } catch {
        return [];
    }
}
