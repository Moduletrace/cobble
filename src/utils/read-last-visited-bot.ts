import { AppData } from "@/src/data/app-data";
import { getCookie } from "./cookies";
import parseLastVisitedBot, { type LastVisitedBot } from "./parse-last-visited-bot";

type Params = {
    req: Request;
};

/**
 * The conversation this browser was last in, from the last-visited cookies
 * (see `lastVisitedBotCookies`). Null when it has none, or when they don't
 * name a conversation. Whether the user still reaches it is the caller's
 * check: a stale grant must fall back, never redirect.
 */
export default function readLastVisitedBot({ req }: Params): LastVisitedBot | null {
    return parseLastVisitedBot({
        bot_id: getCookie(req, AppData["LastVisitedBotCookieName"]),
        workspace_id: getCookie(req, AppData["LastVisitedWorkspaceCookieName"]),
    });
}
