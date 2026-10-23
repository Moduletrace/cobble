import { LogOut, SlidersHorizontal, type LucideIcon } from "lucide-react";
import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import { SettingsDefaultPath } from "@/src/dict/settings-pages-dict";
import { RailPages } from "@/src/dict/rail-pages-dict";

export type RailUserMenuItem = {
    title: string;
    /**
     * Unset for destinations that are not built yet; the item renders
     * disabled.
     */
    url?: string;
    Icon: LucideIcon;
    /**
     * Rendered last, after a rule.
     */
    destructive?: boolean;
    /**
     * Shown to super admins only.
     */
    super_admin_only?: boolean;
    /**
     * Who sees it, when that's an RBAC rule rather than super admins only.
     */
    can_view?: (params: { user_types?: Pick<BUN_SQLITE_COBBLE_USER_TYPES, "user_type">[] | null }) => boolean;
};

/**
 * The popover items: the rail pages (routines, files, usage, activity,
 * help), settings, sign out. Nothing else lives in the rail: these
 * destinations are only reachable from here.
 */
export const RailUserMenuItems: RailUserMenuItem[] = [
    ...RailPages,
    { title: "Settings", url: SettingsDefaultPath, Icon: SlidersHorizontal },
    { title: "Sign out", url: "/auth/logout", Icon: LogOut, destructive: true },
];
