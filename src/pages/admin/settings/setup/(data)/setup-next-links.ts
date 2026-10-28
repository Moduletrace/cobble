import { Bot, Monitor, SlidersHorizontal, Users, Variable } from "lucide-react";
import { AdminHomePath } from "@/src/dict/admin-sections-dict";
import { SettingsComputersPath, SettingsDefaultPath } from "@/src/dict/settings-pages-dict";
import type { SetupLink } from "../(partials)/setup-link-row";

/**
 * Where to go once the models are in: the rest is set up from the pages
 * themselves.
 */
export const SetupNextLinks: SetupLink[] = [
    {
        title: "Meet the coordinator",
        description: "Ask it to put a crew together, or just say hello.",
        href: AdminHomePath,
        Icon: Bot,
    },
    {
        title: "Computers",
        description: "The main computer starts by itself. Add more, or check it's running.",
        href: SettingsComputersPath,
        Icon: Monitor,
    },
    {
        title: "Users",
        description: "Add the people who'll work with your bots.",
        href: "/admin/settings/users",
        Icon: Users,
    },
    {
        title: "Environment",
        description: "Keys and settings your bots' tools need on their computers.",
        href: "/admin/settings/environment",
        Icon: Variable,
    },
    {
        title: "General",
        description: "The app's name and icon, run limits and how long things are kept.",
        href: SettingsDefaultPath,
        Icon: SlidersHorizontal,
    },
];
