/**
 * Paths the loading page never stands in for: the app's code, live data,
 * media, proxied computers and the files the loading page itself needs.
 */
const OpenPrefixes = ["/.bunext/", "/api/", "/ws", "/media", "/computers/"];

type Params = {
    method: string;
    pathname: string;
    /**
     * `Sec-Fetch-Mode` and `Sec-Fetch-Dest`, when the browser sends them.
     * A navigation the service worker passes on keeps `navigate` but
     * arrives with the destination `empty`.
     */
    fetch_mode?: string | null;
    fetch_dest?: string | null;
    accept?: string | null;
    /**
     * The build in the browser's cookie, if any.
     */
    cookie_build_id?: string | null;
    /**
     * The running build; null in development.
     */
    build_id?: string | null;
};

/**
 * Whether a request is a browser opening a page of the app on a build it
 * hasn't downloaded yet, so it gets the loading page instead. Only page
 * navigations: anything with a file extension (`/favicon.ico`,
 * `/sw.js`, `/build-info.json`) goes through as usual.
 */
export default function needsPrecachePage({
    method,
    pathname,
    fetch_mode,
    fetch_dest,
    accept,
    cookie_build_id,
    build_id,
}: Params): boolean {
    if (!build_id) return false;
    if (cookie_build_id == build_id) return false;
    if (method != "GET") return false;
    if (OpenPrefixes.some((prefix) => pathname.startsWith(prefix))) return false;
    if (pathname.split("/").pop()?.includes(".")) return false;

    if (fetch_mode || fetch_dest) {
        return fetch_mode == "navigate" || fetch_dest == "document";
    }

    return Boolean(accept?.includes("text/html"));
}
