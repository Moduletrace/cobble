"use client";

import { useContext, useState } from "react";
import Paper from "@moduletrace/twui/elements/Paper";
import Divider from "@moduletrace/twui/layout/Divider";
import { Download } from "lucide-react";
import { RailUserMenuItems } from "../(dict)/rail-user-menu-dict";
import RailUserMenuEntry from "./rail-user-menu-entry";
import RailUserMenuAction from "./rail-user-menu-action";
import InstallAppModal from "./install-app-modal";
import { AppContext } from "@/src/pages/__root";
import canSeeRailItem from "@/src/utils/rbac/can-see-rail-item";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import useInstallPrompt from "@/src/hooks/use-install-prompt";

/**
 * 220px popover: the only element in the shell with elevation. Items
 * follow the same rule as the rail's lists: super admin ones show to
 * super admins only, RBAC-gated ones by their own rule. Install app shows
 * while the browser can install it; Safari gets the Share menu steps
 * instead.
 */
export default function RailUserMenu() {
    const { pageProps } = useContext(AppContext);
    const is_super_admin = isPassThroughUser({ user_types: pageProps?.user_types });
    const shown = RailUserMenuItems.filter((item) =>
        canSeeRailItem({ item, is_super_admin, user_types: pageProps?.user_types }),
    );
    const items = shown.filter((item) => !item.destructive);
    const destructive = shown.filter((item) => item.destructive);

    const { can_install, needs_ios_steps, installing, install } =
        useInstallPrompt();
    const [ios_modal_open, setIosModalOpen] = useState(false);

    const show_install = can_install || needs_ios_steps;

    return (
        <Paper
            role="menu"
            className="w-[220px] mb-1 p-0! py-1 gap-0! items-stretch rounded-default bg-surface dark:bg-surface border-hairline dark:border-hairline shadow-popover! dark:shadow-popover!"
        >
            {items.map((item) => (
                <RailUserMenuEntry key={item.title} {...item} />
            ))}
            {show_install ? (
                <RailUserMenuAction
                    title={needs_ios_steps ? "How to install" : "Install app"}
                    Icon={Download}
                    disabled={installing}
                    onClick={() => {
                        if (needs_ios_steps) {
                            setIosModalOpen(true);
                            return;
                        }
                        install();
                    }}
                />
            ) : null}
            <Divider className="my-1 mx-3 w-auto border-hairline dark:border-hairline" />
            {destructive.map((item) => (
                <RailUserMenuEntry key={item.title} {...item} />
            ))}
            {needs_ios_steps ? (
                <InstallAppModal
                    open={ios_modal_open}
                    setOpen={setIosModalOpen}
                />
            ) : null}
        </Paper>
    );
}
