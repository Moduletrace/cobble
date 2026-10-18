import {
    Activity,
    CircleHelp,
    Clock,
    LogOut,
    SlidersHorizontal,
    type LucideIcon,
} from "lucide-react";

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
};

/**
 * Exactly the five popover items. Nothing else lives in the rail: these
 * destinations are only reachable from here.
 */
export const RailUserMenuItems: RailUserMenuItem[] = [
    { title: "Activity", url: "/admin/logs", Icon: Activity },
    { title: "Routines", Icon: Clock },
    { title: "Settings", url: "/admin/settings", Icon: SlidersHorizontal },
    { title: "Help", Icon: CircleHelp },
    { title: "Sign out", url: "/auth/logout", Icon: LogOut, destructive: true },
];
