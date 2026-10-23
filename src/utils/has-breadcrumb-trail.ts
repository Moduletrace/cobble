import { AdminHomePath } from "@/src/dict/admin-sections-dict";

type Params = {
    pathname?: string | null;
};

/**
 * Whether an address has a trail above it: `Home`, then every section it
 * passes through, then the page. `twui`'s `Breadcrumbs` draws the trail
 * itself from the path, so this only answers which pages get one.
 *
 * The crew of bots is where the app lands, and its own address would
 * read `Home / Bots`, both the same page, so it has none. Neither does
 * anything outside the admin pages, since everything else redirects to
 * the bots.
 *
 * The trailing slash and the query string are ignored, so a folder opened
 * in the files browser keeps the trail of the page it is on.
 */
export default function hasBreadcrumbTrail({ pathname }: Params): boolean {
    if (!pathname) return false;

    const path = pathname.split("?")[0]!.replace(/\/$/, "");

    if (path != "/admin" && !path.startsWith("/admin/")) return false;

    /**
     * `/admin` only redirects to the crew of bots, which is home.
     */
    return path != AdminHomePath && path != "/admin";
}
