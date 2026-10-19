import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";
import SettingsList from "@/src/pages/admin/settings/(partials)/settings-list";
import type { ComputerWithStatus } from "@/src/types";
import WorkspaceDashboardComputerRow from "./workspace-dashboard-computer-row";

type Props = {
    /**
     * The computers linked to the workspace, its default first.
     */
    computers: ComputerWithStatus[];
};

/**
 * The computers bots work on here, with their state. Display only:
 * computers are linked and set up under Settings.
 */
export default function WorkspaceComputersListGroup({ computers }: Props) {
    return (
        <SettingsGroup
            id="computers"
            title="Computers"
            description="Where tasks run. The default one is used unless a bot picks another."
        >
            <SettingsList
                is_empty={!computers.length}
                empty="No computers here yet. Bots can chat, but tasks that need a computer can't run."
            >
                {computers.map((computer, index) => (
                    <WorkspaceDashboardComputerRow
                        key={computer.id}
                        computer={computer}
                        is_default={index == 0}
                    />
                ))}
            </SettingsList>
        </SettingsGroup>
    );
}
