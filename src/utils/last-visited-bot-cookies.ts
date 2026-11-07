import { AppData } from "@/src/data/app-data";
import type { CookieOptions } from "./cookies";

type Params = {
    bot_id: number | string;
    /**
     * The workspace the conversation is in; none for the bot's own chat.
     */
    workspace_id?: number | string | null;
    /**
     * From `isSecureRequest`, so plain HTTP over a VPN still keeps it.
     */
    secure: boolean;
};

/**
 * The cookie that remembers the conversation this browser is in, for
 * `setCookies`: `<bot_id>`, or `<bot_id>:<workspace_id>` inside a
 * workspace, read back by `readLastVisitedBot`. The bots' landing page uses
 * only the bot (it always reopens the bot's own chat); the rail's way back
 * from settings and the rail pages uses both. `HttpOnly`, since only the
 * server reads it, and it holds nothing but ids.
 */
export default function lastVisitedBotCookies({ bot_id, workspace_id, secure }: Params): CookieOptions[] {
    return [
        {
            name: AppData["LastVisitedBotCookieName"],
            value: workspace_id ? `${bot_id}:${workspace_id}` : String(bot_id),
            secure,
            maxAge: AppData["LastVisitedCookieMaxAgeSeconds"],
        },
    ];
}
