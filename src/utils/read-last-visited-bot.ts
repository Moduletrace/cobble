import { AppData } from "@/src/data/app-data";
import { getCookie } from "./cookies";
import parseLastVisitedBot, { type LastVisitedBot } from "./parse-last-visited-bot";

type Params = {
    req: Request;
};

/**
 * The conversation this browser was last in, from the last-visited cookie
 * (see `lastVisitedBotCookies`). Null when it has none, or when it doesn't
 * name a bot. Whether the user still reaches it is the caller's check: a
 * stale grant must fall back, never redirect.
 */
export default function readLastVisitedBot({ req }: Params): LastVisitedBot | null {
    return parseLastVisitedBot({
        value: getCookie(req, AppData["LastVisitedBotCookieName"]),
    });
}
