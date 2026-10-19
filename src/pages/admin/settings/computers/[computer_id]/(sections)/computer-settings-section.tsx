import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import useLiveComputers from "@/src/hooks/use-live-computers";
import type { ComputerWithStatus } from "@/src/types";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import SettingsShell from "../../../(partials)/settings-shell";
import ComputerBotsGroup from "../(partials)/computer-bots-group";
import ComputerDangerGroup from "../(partials)/computer-danger-group";
import ComputerDetailsGroup from "../(partials)/computer-details-group";
import ComputerOverviewGroup from "../(partials)/computer-overview-group";
import ComputerWorkspacesGroup from "../(partials)/computer-workspaces-group";

/**
 * One computer's settings: its state and resources, direct bot access,
 * linked workspaces, and retrying or deleting it. Super admins edit and
 * manage the danger zone; admins see the rest.
 */
export default function ComputerSettingsSection() {
    const { pageProps } = useContext(AppContext);
    const initial = pageProps?.computer;
    const { computers, setComputers } = useLiveComputers({
        computers: initial ? [initial] : [],
    });

    if (!initial?.id) return null;

    const computer =
        computers.find((item) => item.id == initial.id) || initial;
    const name = computer.name || `Computer ${computer.id}`;
    const is_super_admin = isPassThroughUser({
        user_types: pageProps?.user_types,
    });

    const update = (next: ComputerWithStatus) =>
        setComputers((prev) =>
            prev.some((item) => item.id == next.id)
                ? prev.map((item) => (item.id == next.id ? { ...item, ...next } : item))
                : [...prev, next],
        );

    return (
        <SettingsShell
            title={name}
            description={
                computer.description ||
                "Its container, the bots that reach it, and its workspaces."
            }
            breadcrumb_title={name}
        >
            <ComputerOverviewGroup computer={computer} />
            {is_super_admin ? (
                <ComputerDetailsGroup
                    computer={computer}
                    onUpdated={update}
                />
            ) : null}
            <ComputerBotsGroup
                computer={computer}
                bots={pageProps?.bots || []}
                computer_bots={pageProps?.computer_bots || []}
                is_super_admin={is_super_admin}
            />
            <ComputerWorkspacesGroup
                computer={computer}
                workspaces={pageProps?.workspaces || []}
                computer_workspaces={pageProps?.computer_workspaces || []}
            />
            {is_super_admin ? (
                <ComputerDangerGroup computer={computer} onUpdated={update} />
            ) : null}
        </SettingsShell>
    );
}
