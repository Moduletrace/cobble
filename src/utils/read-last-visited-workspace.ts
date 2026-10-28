import { AppData } from "@/src/data/app-data";
import { getCookie } from "./cookies";
import parsePositiveId from "./parse-positive-id";

type Params = {
    req: Request;
};

/**
 * The workspace this browser was last in, from the last-visited cookie
 * (see `lastVisitedWorkspaceCookies`), or null. Only orders the rail, so a
 * workspace the user no longer reaches just isn't in the list.
 */
export default function readLastVisitedWorkspace({ req }: Params): number | null {
    return parsePositiveId({
        value: getCookie(req, AppData["LastVisitedWorkspaceCookieName"]),
    });
}
