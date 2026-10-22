"use client";

import { useEffect, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import { Moon, Sun } from "lucide-react";
import useThemePreference from "@/src/hooks/use-theme-preference";
import resolveTheme from "@/src/utils/resolve-theme";

const DarkQuery = "(prefers-color-scheme: dark)";

/**
 * The rail header's scheme toggle: one click flips between light and dark
 * for this device, stored where `ThemeInitScript` reads it. Following the
 * device stays on Settings > General, since a toggle is always an explicit
 * choice. It renders after mount only, because the painted scheme is
 * decided on the client.
 */
export default function RailThemeToggle() {
    const { preference, setPreference } = useThemePreference();
    const [mounted, setMounted] = useState(false);
    const [system_is_dark, setSystemIsDark] = useState(false);

    useEffect(() => {
        setMounted(true);

        const media = window.matchMedia(DarkQuery);
        const onChange = () => setSystemIsDark(media.matches);

        onChange();
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
    }, []);

    if (!mounted) return null;

    const is_dark =
        (preference
            ? resolveTheme({ preference, system_is_dark })
            : system_is_dark
                ? "dark"
                : "light") == "dark";
    const title = is_dark ? "Switch to the light theme" : "Switch to the dark theme";
    const Icon = is_dark ? Moon : Sun;

    return (
        <Button
            title={title}
            aria-label={title}
            type="button"
            variant="ghost"
            color="text"
            onClick={() => setPreference(is_dark ? "light" : "dark")}
            className="hidden @rail:flex shrink-0 p-1.5! rounded-default-sm text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink"
        >
            <Icon size={18} aria-hidden />
        </Button>
    );
}
