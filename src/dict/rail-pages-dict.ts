import { Activity, CircleHelp, Clock, type LucideIcon } from "lucide-react";
import { HelpPath } from "./help-dict";

export type RailPage = {
    title: string;
    url: string;
    Icon: LucideIcon;
    /**
     * Shown and served to super admins only.
     */
    super_admin_only?: boolean;
};

export const RoutinesPath = "/admin/routines";
export const ActivityPath = "/admin/logs";

/**
 * Pages opened from the rail's user popover that have their own rail: a
 * back link, then this list (like settings).
 */
export const RailPages: RailPage[] = [
    { title: "Routines", url: RoutinesPath, Icon: Clock },
    { title: "Activity", url: ActivityPath, Icon: Activity, super_admin_only: true },
    { title: "Help", url: HelpPath, Icon: CircleHelp },
];
