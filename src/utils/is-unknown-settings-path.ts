import { SettingsPages } from "@/src/dict/settings-pages-dict";

type Params = {
    pathname: string;
};

/**
 * Whether `pathname` is under `/admin/settings/` but not one of the
 * `SettingsPages` (or a page nested under one).
 */
export default function isUnknownSettingsPath({ pathname }: Params) {
    const current = pathname.replace(/\/$/, "");

    if (!current.startsWith("/admin/settings/")) {
        return false;
    }

    return !SettingsPages.some(
        (page) => current == page.url || current.startsWith(`${page.url}/`),
    );
}
