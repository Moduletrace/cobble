import type { LoginMethod } from "@/src/types";
import type { AdminAsideLinkItem } from "../(dict)/admin-aside-groups-dict";

type Params = {
    links: AdminAsideLinkItem[];
    is_super_admin: boolean;
    login_method: LoginMethod;
};

/**
 * Drops links (and nested children) the current user/site config should not
 * see.
 */
export default function filterAdminAsideLinks({
    links,
    is_super_admin,
    login_method,
}: Params): AdminAsideLinkItem[] {
    return links
        .filter((link) => is_super_admin || !link.super_admin_only)
        .filter(
            (link) => login_method == "password" || !link.password_method_only,
        )
        .map((link) =>
            link.children
                ? {
                      ...link,
                      children: filterAdminAsideLinks({
                          links: link.children,
                          is_super_admin,
                          login_method,
                      }),
                  }
                : link,
        );
}
