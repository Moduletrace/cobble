import {
    KeyRound,
    SlidersHorizontal,
    UserRound,
    type LucideIcon,
} from "lucide-react";

export type SettingsPage = {
    title: string;
    url: string;
    Icon: LucideIcon;
};

/**
 * The `/admin/settings/*` sub pages, listed in the rail on every settings
 * page. The first one is where `/admin/settings` lands.
 */
export const SettingsPages: SettingsPage[] = [
    {
        title: "General",
        url: "/admin/settings/general",
        Icon: SlidersHorizontal,
    },
    { title: "Profile", url: "/admin/settings/profile", Icon: UserRound },
    {
        title: "Change password",
        url: "/admin/settings/change-password",
        Icon: KeyRound,
    },
];

export const SettingsDefaultPath = "/admin/settings/general";
