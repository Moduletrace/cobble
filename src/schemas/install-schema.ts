import { z } from "zod";
import { BotHues } from "@/src/dict/bot-dict";
import { PwaInstallIconModes, PwaInstallNameMaxLength } from "@/src/data/pwa-data";

export const SaveInstallNameRequestSchema = z.object({
    install_name: z.string().trim().max(PwaInstallNameMaxLength),
});

export const SaveInstallIconRequestSchema = z.object({
    mode: z.enum(PwaInstallIconModes),
    stone: z.enum(BotHues.map((hue) => hue.value) as [string, ...string[]], "Pick a stone"),
    mark: z.boolean(),
    /**
     * A newly picked image as a base64 data URL; omitted to keep the
     * stored one.
     */
    data_url: z.string().startsWith("data:image/", "Send the image as a data URL").nullish(),
});

export type SaveInstallIconRequest = z.infer<typeof SaveInstallIconRequestSchema>;
