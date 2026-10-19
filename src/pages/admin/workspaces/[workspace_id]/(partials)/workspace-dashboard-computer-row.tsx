import ComputerIconTile from "@/src/components/general/computer-icon-tile";
import SettingsListRow from "@/src/pages/admin/settings/(partials)/settings-list-row";
import type { ComputerWithStatus } from "@/src/types";
import computerStatusLabel from "@/src/utils/computer-status-label";

type Props = {
    computer: ComputerWithStatus;
    is_default: boolean;
};

/**
 * A computer in the workspace dashboard: its state and what it's for.
 */
export default function WorkspaceDashboardComputerRow({ computer, is_default }: Props) {
    const name = computer.name || `Computer ${computer.id}`;

    return (
        <SettingsListRow
            avatar={<ComputerIconTile />}
            title={name}
            badge={is_default ? "Default" : undefined}
            subtitle={`${computerStatusLabel({ computer })}${computer.description ? ` · ${computer.description}` : ""}`}
        />
    );
}
