import { RailPages } from "@/src/dict/rail-pages-dict";

type Params = {
    pathname?: string | null;
};

/**
 * Whether the page's rail lists pages rather than the crew: settings and
 * the rail pages (routines, files, usage, activity, help). Those rails lead
 * back to the last conversation (`last_conversation`).
 */
export default function isPagesRailPath({ pathname }: Params): boolean {
    if (!pathname) return false;

    if (pathname == "/admin/settings" || pathname.startsWith("/admin/settings/")) {
        return true;
    }

    return RailPages.some(
        (page) => pathname == page.url || pathname.startsWith(`${page.url}/`),
    );
}
