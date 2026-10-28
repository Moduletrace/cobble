import { AppData } from "@/src/data/app-data";
import type { CookieOptions } from "./cookies";

type Params = {
    workspace_id: number | string;
    /**
     * From `isSecureRequest`, so plain HTTP over a VPN still keeps it.
     */
    secure: boolean;
};

/**
 * The cookie that remembers the workspace this browser was last in, for
 * `setCookies`: read back by `readLastVisitedWorkspace` in the root, so the
 * rail lists that workspace first. It never decides where `/admin/bots`
 * lands. `HttpOnly`, since only the server reads it.
 */
export default function lastVisitedWorkspaceCookies({ workspace_id, secure }: Params): CookieOptions[] {
    return [
        {
            name: AppData["LastVisitedWorkspaceCookieName"],
            value: String(workspace_id),
            secure,
            maxAge: AppData["LastVisitedCookieMaxAgeSeconds"],
        },
    ];
}
