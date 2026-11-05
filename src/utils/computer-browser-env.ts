import { ComputerDefaultBrowserScale } from "@/src/dict/computer-dict";
import type { ComputerBrowserSettings } from "@/src/schemas/computer-schema";

type Params = {
    settings: ComputerBrowserSettings;
    /**
     * The timezone when the settings name none: the app's own (`TZ`).
     */
    fallback_timezone?: string | null;
};

/**
 * A computer's browser settings as its container's env, which its agent
 * reads (`computer/agent/config.ts`); a setting left out is left out, so
 * the agent's default holds.
 */
export default function computerBrowserEnv({ settings, fallback_timezone }: Params) {
    const timezone = settings.timezone || fallback_timezone?.trim();
    const env: Record<string, string | undefined> = {
        TZ: timezone || undefined,
        COBBLE_SCREEN: settings.screen,
        COBBLE_BROWSER_SCALE:
            settings.scale && settings.scale != ComputerDefaultBrowserScale ? String(Number(settings.scale) / 100) : undefined,
        COBBLE_BROWSER_LANG: settings.language,
        COBBLE_BROWSER_ACCEPT_LANG: settings.accept_languages?.replace(/\s+/g, ""),
        COBBLE_BROWSER_SANDBOX: settings.sandbox === false ? "false" : undefined,
        COBBLE_BROWSER_ARGS: settings.browser_args,
        COBBLE_MCP_ARGS: settings.mcp_args,
    };

    return Object.entries(env)
        .filter((entry): entry is [string, string] => Boolean(entry[1]))
        .map(([key, value]) => `${key}=${value}`);
}
