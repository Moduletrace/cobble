import {
    Bot,
    Database,
    Images,
    Layers,
    Monitor,
    Plug,
    type LucideIcon,
} from "lucide-react";
import type { StorageVolume } from "@/src/utils/storage-volumes";

/**
 * The icon each volume's folder rows lead with in the files browser's
 * picker, imported one by one (never by name: a string icon ships every
 * icon). Route-local so the shared, server-safe storage utils stay free
 * of lucide.
 */
export const StorageVolumeIcons: Record<StorageVolume, LucideIcon> = {
    bots: Bot,
    workspaces: Layers,
    computers: Monitor,
    media: Images,
    mcp: Plug,
    db: Database,
};

/**
 * The tinted box each volume icon sits in: a soft wash and icon color from
 * the hue palette, one hue per volume so the picker reads at a glance.
 * Static class names only, so Tailwind keeps them.
 */
export const StorageVolumeIconClasses: Record<StorageVolume, string> = {
    bots: "bg-hue-ember/15 text-hue-ember dark:bg-hue-ember/25",
    workspaces: "bg-hue-teal/15 text-hue-teal dark:bg-hue-teal/25",
    computers: "bg-hue-cobalt/15 text-hue-cobalt dark:bg-hue-cobalt/25",
    media: "bg-hue-violet/15 text-hue-violet dark:bg-hue-violet/25",
    mcp: "bg-hue-moss/15 text-hue-moss dark:bg-hue-moss/25",
    db: "bg-hue-amber/15 text-hue-amber dark:bg-hue-amber/25",
};
