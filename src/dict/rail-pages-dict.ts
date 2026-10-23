import { Activity, BarChart3, CircleHelp, Clock, FolderOpen, type LucideIcon } from "lucide-react";
import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import { HelpPath } from "./help-dict";

export type RailPage = {
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
    can_view?: (params: { user_types?: Pick<BUN_SQLITE_COBBLE_USER_TYPES, "user_type">[] | null }) => boolean;
};

export const RoutinesPath = "/admin/routines";
export const FilesPath = "/admin/files";
export const ActivityPath = "/admin/logs";
export const UsagePath = "/admin/usage";

/**
 * Pages opened from the rail's user popover that have their own rail: a
 * back link, then this list (like settings).
 */
export const RailPages: RailPage[] = [
    { title: "Routines", url: RoutinesPath, Icon: Clock },
    { title: "Files", url: FilesPath, Icon: FolderOpen },
    { title: "Usage", url: UsagePath, Icon: BarChart3, can_view: canManageCrew },
    { title: "Activity", url: ActivityPath, Icon: Activity, super_admin_only: true },
    { title: "Help", url: HelpPath, Icon: CircleHelp },
];
