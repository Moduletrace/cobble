import { useContext } from "react";
import Divider from "@moduletrace/twui/layout/Divider";
import { SettingsPages } from "@/src/dict/settings-pages-dict";
import { AppContext } from "@/src/pages/__root";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import RailBackLink from "./rail-back-link";
import RailSettingsLink from "./rail-settings-link";

type Props = {
    pathname?: string;
};

/**
 * Settings mode of the rail: back to the bots, then the settings sub pages
 * (super admin pages only for super admins, RBAC-gated pages by their
 * own rule).
 */
export default function RailSettingsList({ pathname }: Props) {
    const { pageProps } = useContext(AppContext);
    const current = pathname?.replace(/\/$/, "");
    const is_super_admin = isPassThroughUser({
        user_types: pageProps?.user_types,
    });

    return (
        <>
            <RailBackLink />
            <Divider className="shrink-0 mx-1 lg:mx-3 my-2 w-auto border-hairline dark:border-hairline" />
            {SettingsPages.filter((page) =>
                page.can_view
                    ? page.can_view({ user_types: pageProps?.user_types })
                    : is_super_admin || !page.super_admin_only,
            ).map((page) => (
                <RailSettingsLink
                    key={page.url}
                    {...page}
                    selected={
                        current == page.url ||
                        Boolean(current?.startsWith(`${page.url}/`))
                    }
                />
            ))}
        </>
    );
}
