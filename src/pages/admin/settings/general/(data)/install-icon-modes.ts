import { Gem, ImageIcon } from "lucide-react";
import type { PwaInstallIconMode } from "@/src/data/pwa-data";

/**
 * The two kinds of app icon an install can have (Settings > General).
 */
export const InstallIconModes: {
    value: PwaInstallIconMode;
    title: string;
    description: string;
    Icon: typeof Gem;
}[] = [
    {
        value: "stone",
        title: "Stone",
        description: "One of the stones on paper.",
        Icon: Gem,
    },
    {
        value: "image",
        title: "Image",
        description: "Your own image, with a stone in the corner.",
        Icon: ImageIcon,
    },
];
