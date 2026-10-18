import { Monitor, Moon, Sun, type LucideIcon } from "lucide-react";

export const ThemePreferences = [
    {
        title: "System",
        value: "system",
        description: "Follows your device",
        Icon: Monitor,
    },
    {
        title: "Light",
        value: "light",
        description: "Paper and ink",
        Icon: Sun,
    },
    {
        title: "Dark",
        value: "dark",
        description: "Easy at night",
        Icon: Moon,
    },
] as const satisfies {
    title: string;
    value: string;
    description: string;
    Icon: LucideIcon;
}[];

export type ThemePreference = (typeof ThemePreferences)[number]["value"];
