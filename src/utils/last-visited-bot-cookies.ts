import { AppData } from "@/src/data/app-data";
import type { CookieOptions } from "./cookies";

type Params = {
    bot_id: number | string;
    /**
     * From `isSecureRequest`, so plain HTTP over a VPN still keeps it.
     */
    secure: boolean;
};

/**
 * The cookie that remembers the bot this browser is in, for `setCookies`:
 * read back by `readLastVisitedBot` on the bots' landing page. `HttpOnly`,
 * since only the server reads it, and it holds nothing but an id. A
 * conversation inside a workspace is never remembered, so the landing page
 * always reopens the bot's own chat.
 */
export default function lastVisitedBotCookies({ bot_id, secure }: Params): CookieOptions[] {
    return [
        {
            name: AppData["LastVisitedBotCookieName"],
            value: String(bot_id),
            secure,
            maxAge: AppData["LastVisitedCookieMaxAgeSeconds"],
        },
    ];
}
