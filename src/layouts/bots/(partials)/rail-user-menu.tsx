import { useContext } from "react";
import Paper from "@moduletrace/twui/elements/Paper";
import Divider from "@moduletrace/twui/layout/Divider";
import { RailUserMenuItems } from "../(dict)/rail-user-menu-dict";
import RailUserMenuEntry from "./rail-user-menu-entry";
import { AppContext } from "@/src/pages/__root";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";

/**
 * 220px popover: the only element in the shell with elevation. Super
 * admin items show to super admins only.
 */
export default function RailUserMenu() {
    const { pageProps } = useContext(AppContext);
    const is_super_admin = isPassThroughUser({ user_types: pageProps?.user_types });
    const shown = RailUserMenuItems.filter((item) => is_super_admin || !item.super_admin_only);
    const items = shown.filter((item) => !item.destructive);
    const destructive = shown.filter((item) => item.destructive);

    return (
        <Paper
            role="menu"
            className="w-[220px] mb-1 p-0! py-1 gap-0! items-stretch rounded-default bg-surface dark:bg-surface border-hairline dark:border-hairline shadow-popover! dark:shadow-popover!"
        >
            {items.map((item) => (
                <RailUserMenuEntry key={item.title} {...item} />
            ))}
            <Divider className="my-1 mx-3 w-auto border-hairline dark:border-hairline" />
            {destructive.map((item) => (
                <RailUserMenuEntry key={item.title} {...item} />
            ))}
        </Paper>
    );
}
