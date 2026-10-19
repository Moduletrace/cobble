import {
    CpuAi,
    KeyRound,
    SlidersHorizontal,
    UserRound,
    Variable,
    type LucideIcon,
} from "lucide-react";

export type SettingsPage = {
    title: string;
    url: string;
    Icon: LucideIcon;
    /**
     * Shown and served to super admins only.
     */
    super_admin_only?: boolean;
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
    {
        title: "Models",
        url: "/admin/settings/models",
        Icon: CpuAi,
        super_admin_only: true,
    },
    {
        title: "Environment",
        url: "/admin/settings/environment",
        Icon: Variable,
        super_admin_only: true,
    },
];

export const SettingsDefaultPath = "/admin/settings/general";
