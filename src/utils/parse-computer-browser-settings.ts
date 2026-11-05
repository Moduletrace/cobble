import { ComputerBrowserSettingsSchema, type ComputerBrowserSettings } from "@/src/schemas/computer-schema";

/**
 * A computer's stored browser settings (`computers.browser_settings`),
 * checked again; anything unreadable reads as the defaults.
 */
export default function parseComputerBrowserSettings({ text }: { text?: string | null }): ComputerBrowserSettings {
    try {
        const parsed = ComputerBrowserSettingsSchema.safeParse(JSON.parse(text || "{}"));

        return parsed.success ? parsed.data : {};
    } catch {
        return {};
    }
}
