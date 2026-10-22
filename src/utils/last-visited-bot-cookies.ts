import { AppData } from "@/src/data/app-data";
import type { CookieOptions } from "./cookies";

type Params = {
    bot_id: number | string;
    /**
     * Null or undefined: the bot's own chat.
     */
    workspace_id?: number | string | null;
    /**
     * From `isSecureRequest`, so plain HTTP over a VPN still keeps them.
     */
    secure: boolean;
};

/**
 * The cookies that remember the conversation this browser is in, for
 * `setCookies`: read back by `readLastVisitedBot` on the bots' landing page.
 * `HttpOnly`, since only the server reads them, and they hold nothing but
 * two ids.
 */
export default function lastVisitedBotCookies({
    bot_id,
    workspace_id,
    secure,
}: Params): CookieOptions[] {
    return [
        {
            name: AppData["LastVisitedBotCookieName"],
            value: String(bot_id),
            secure,
            maxAge: AppData["LastVisitedCookieMaxAgeSeconds"],
        },
        {
            name: AppData["LastVisitedWorkspaceCookieName"],
            value: workspace_id ? String(workspace_id) : "",
            secure,
            maxAge: AppData["LastVisitedCookieMaxAgeSeconds"],
        },
    ];
}
