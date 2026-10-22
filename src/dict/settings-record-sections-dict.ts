import {
    Bot,
    CircleAlert,
    CpuAi,
    Image,
    Info,
    Layers,
    Monitor,
    Pencil,
    Trash2,
    type LucideIcon,
} from "lucide-react";
import type { SettingsRecordKind } from "@/src/utils/parse-settings-record-path";

export type SettingsRecordSection = {
    title: string;
    url: string;
    Icon: LucideIcon;
};

/**
 * Where the record rail's back link goes, and the sections it lists.
 */
export const SettingsRecordBack: Record<
    SettingsRecordKind,
    { title: string; href: string }
> = {
    bots: { title: "All bots", href: "/admin/settings/bots" },
    workspaces: { title: "All workspaces", href: "/admin/settings/workspaces" },
    users: { title: "All users", href: "/admin/settings/users" },
    computers: { title: "All computers", href: "/admin/settings/computers" },
};

export const SettingsRecordSections: Record<
    SettingsRecordKind,
    SettingsRecordSection[]
> = {
    bots: [
        { title: "Overview", url: "#overview", Icon: Info },
        { title: "Details", url: "#details", Icon: Pencil },
        { title: "Models", url: "#models", Icon: CpuAi },
        { title: "Workspaces", url: "#workspaces", Icon: Layers },
        { title: "Computers", url: "#computers", Icon: Monitor },
        { title: "Danger Zone", url: "#danger-zone", Icon: CircleAlert },
    ],
    workspaces: [
        { title: "Picture", url: "#picture", Icon: Image },
        { title: "Details", url: "#details", Icon: Pencil },
        { title: "Bots", url: "#bots", Icon: Bot },
        { title: "Computers", url: "#computers", Icon: Monitor },
        { title: "Models", url: "#models", Icon: CpuAi },
        { title: "Danger Zone", url: "#danger-zone", Icon: CircleAlert },
    ],
    users: [
        { title: "Overview", url: "#overview", Icon: Info },
        { title: "Edit", url: "#edit", Icon: Pencil },
        { title: "Danger zone", url: "#danger", Icon: CircleAlert },
    ],
    computers: [
        { title: "Overview", url: "#overview", Icon: Info },
        { title: "Details", url: "#details", Icon: Pencil },
        { title: "Bots", url: "#bots", Icon: Bot },
        { title: "Workspaces", url: "#workspaces", Icon: Layers },
        { title: "Danger zone", url: "#danger", Icon: CircleAlert },
    ],
};
