import { useEffect, useState } from "react";
import { AppData } from "@/src/data/app-data";
import type { ThemePreference } from "@/src/dict/theme-preferences-dict";
import resolveTheme from "@/src/utils/resolve-theme";

const DarkQuery = "(prefers-color-scheme: dark)";

function readPreference(): ThemePreference {
    try {
        const stored = localStorage.getItem(AppData["ThemeStorageKey"]);
        return stored == "dark" || stored == "light" ? stored : "system";
    } catch {
        return "system";
    }
}

function applyTheme({ preference }: { preference: ThemePreference }) {
    const theme = resolveTheme({
        preference,
        system_is_dark: window.matchMedia(DarkQuery).matches,
    });

    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
}

/**
 * This device's color scheme choice, stored where `ThemeInitScript` reads
 * it. `system` stores nothing and tracks the OS live.
 */
export default function useThemePreference() {
    const [preference, setPreferenceState] = useState<ThemePreference>();

    useEffect(() => {
        setPreferenceState(readPreference());
    }, []);

    useEffect(() => {
        if (preference != "system") return;

        const media = window.matchMedia(DarkQuery);
        const onChange = () => applyTheme({ preference: "system" });

        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, [preference]);

    const setPreference = (next: ThemePreference) => {
        try {
            if (next == "system") {
                localStorage.removeItem(AppData["ThemeStorageKey"]);
            } else {
                localStorage.setItem(AppData["ThemeStorageKey"], next);
            }
        } catch {}

        applyTheme({ preference: next });
        setPreferenceState(next);
    };

    return { preference, setPreference };
}
