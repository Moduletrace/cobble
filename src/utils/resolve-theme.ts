import type { ThemePreference } from "@/src/dict/theme-preferences-dict";

type Params = {
    preference: ThemePreference;
    system_is_dark: boolean;
};

/**
 * The scheme to put on `<html>` for a preference.
 */
export default function resolveTheme({
    preference,
    system_is_dark,
}: Params): "light" | "dark" {
    if (preference == "system") {
        return system_is_dark ? "dark" : "light";
    }

    return preference;
}
