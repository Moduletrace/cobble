import { useContext } from "react";
import Divider from "@moduletrace/twui/layout/Divider";
import { RailPages } from "@/src/dict/rail-pages-dict";
import { AppContext } from "@/src/pages/__root";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import RailBackLink from "./rail-back-link";
import RailSettingsLink from "./rail-settings-link";

type Props = {
    pathname?: string;
};

/**
 * The rail on routines, activity and help: back to the bots, then those
 * pages (super admin ones for super admins only).
 */
export default function RailPagesList({ pathname }: Props) {
    const { pageProps } = useContext(AppContext);
    const current = pathname?.replace(/\/$/, "");
    const is_super_admin = isPassThroughUser({ user_types: pageProps?.user_types });

    return (
        <>
            <RailBackLink />
            <Divider className="shrink-0 mx-1 lg:mx-3 my-2 w-auto border-hairline dark:border-hairline" />
            {RailPages.filter((page) => is_super_admin || !page.super_admin_only).map((page) => (
                <RailSettingsLink
                    key={page.url}
                    {...page}
                    selected={current == page.url || Boolean(current?.startsWith(`${page.url}/`))}
                />
            ))}
        </>
    );
}
