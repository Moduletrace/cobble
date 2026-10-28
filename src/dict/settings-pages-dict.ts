import {
    BookOpen,
    Bot,
    CpuAi,
    Database,
    DatabaseBackup,
    KeyRound,
    Layers,
    Library,
    LockKeyhole,
    Monitor,
    Plug,
    Rocket,
    Users,
    SlidersHorizontal,
    UserRound,
    Variable,
    Wrench,
    type LucideIcon,
} from "lucide-react";
import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import canListUsers from "@/src/utils/rbac/can-list-users";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";

export type SettingsPage = {
    title: string;
    url: string;
    Icon: LucideIcon;
    /**
     * Shown and served to super admins only.
     */
    super_admin_only?: boolean;
    /**
     * Who sees it, when that's an RBAC rule rather than super admins only.
     */
    can_view?: (params: { user_types?: BUN_SQLITE_COBBLE_USER_TYPES[] | null }) => boolean;
};

export const SettingsComputersPath = "/admin/settings/computers";
export const SettingsBackupsPath = "/admin/settings/backups";
export const SettingsDatabasePath = "/admin/settings/database";
export const SettingsSetupPath = "/admin/settings/setup";
export const SettingsModelsPath = "/admin/settings/models";

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
    {
        title: "Setup",
        url: SettingsSetupPath,
        Icon: Rocket,
        super_admin_only: true,
    },
    { title: "Profile", url: "/admin/settings/profile", Icon: UserRound },
    {
        title: "Change password",
        url: "/admin/settings/change-password",
        Icon: KeyRound,
    },
    { title: "Secrets", url: "/admin/settings/secrets", Icon: LockKeyhole },
    { title: "Bots", url: "/admin/settings/bots", Icon: Bot, can_view: canManageCrew },
    { title: "Workspaces", url: "/admin/settings/workspaces", Icon: Layers, can_view: canManageCrew },
    { title: "Computers", url: SettingsComputersPath, Icon: Monitor, can_view: canManageCrew },
    { title: "MCPs", url: "/admin/settings/mcps", Icon: Plug, can_view: canManageCrew },
    { title: "Tools", url: "/admin/settings/tools", Icon: Wrench, can_view: canManageCrew },
    { title: "Skills", url: "/admin/settings/skills", Icon: BookOpen, can_view: canManageCrew },
    { title: "Knowledgebases", url: "/admin/settings/knowledgebases", Icon: Library, can_view: canManageCrew },
    {
        title: "Users",
        url: "/admin/settings/users",
        Icon: Users,
        can_view: canListUsers,
    },
    {
        title: "Models",
        url: SettingsModelsPath,
        Icon: CpuAi,
        super_admin_only: true,
    },
    {
        title: "Environment",
        url: "/admin/settings/environment",
        Icon: Variable,
        super_admin_only: true,
    },
    {
        title: "Backups",
        url: SettingsBackupsPath,
        Icon: DatabaseBackup,
        super_admin_only: true,
    },
    {
        title: "Database",
        url: SettingsDatabasePath,
        Icon: Database,
        super_admin_only: true,
    },
];

export const SettingsDefaultPath = "/admin/settings/general";
