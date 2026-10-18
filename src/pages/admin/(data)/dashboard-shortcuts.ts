import { Bot, Users, type LucideIcon } from "lucide-react";

export type DashboardShortcut = {
    title: string;
    description: string;
    url: string;
    Icon: LucideIcon;
};

export const DashboardShortcuts: DashboardShortcut[] = [
    {
        title: "Bots",
        description: "Talk to your crew, see what they are working on and answer what needs you.",
        url: "/admin/bots",
        Icon: Bot,
    },
    {
        title: "People",
        description: "Manage admin users, roles and access.",
        url: "/admin/people",
        Icon: Users,
    },
];
