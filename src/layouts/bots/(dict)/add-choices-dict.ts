import { Bot, Layers, Monitor, type LucideIcon } from "lucide-react";

export const AddKinds = ["bot", "workspace", "computer"] as const;

export type AddKind = (typeof AddKinds)[number];

export type AddChoice = {
    kind: AddKind;
    title: string;
    description: string;
    Icon: LucideIcon;
    /**
     * Only super admins see it: a computer is a container on this host.
     */
    super_admin_only?: boolean;
};

/**
 * What the Add modal offers, in order.
 */
export const AddChoices: AddChoice[] = [
    {
        kind: "bot",
        title: "Bot",
        description: "A crew member with a job of its own. It can work in any number of workspaces.",
        Icon: Bot,
    },
    {
        kind: "workspace",
        title: "Workspace",
        description: "A place for a project: shared context, its own bots, computers and models.",
        Icon: Layers,
    },
    {
        kind: "computer",
        title: "Computer",
        description: "A Linux sandbox bots work in: a shell, a browser and files of its own.",
        Icon: Monitor,
        super_admin_only: true,
    },
];
