import ComputerIconTile from "@/src/components/general/computer-icon-tile";
import type { ComputerWithStatus } from "@/src/types";
import computerResourcesLabel from "@/src/utils/computer-resources-label";
import computerStatusLabel from "@/src/utils/computer-status-label";
import SettingsListRow from "../../(partials)/settings-list-row";
import SettingsRowAction from "../../(partials)/settings-row-action";

type Props = {
    computer: ComputerWithStatus;
    is_super_admin: boolean;
    busy?: boolean;
    onRetry: () => void;
    onDelete: () => void;
};

/**
 * One computer: its name, state and resources. The title opens its
 * settings page; super admins can retry a failed setup and delete a
 * sandbox.
 */
export default function ComputerSettingsRow({
    computer,
    is_super_admin,
    busy,
    onRetry,
    onDelete,
}: Props) {
    const name = computer.name || `Computer ${computer.id}`;
    const busy_here = busy || computer.status == "creating";

    return (
        <SettingsListRow
            avatar={<ComputerIconTile />}
            href={`/admin/settings/computers/${computer.id}`}
            title={name}
            badge={computer.kind == "main" ? "Main" : undefined}
            subtitle={[
                computerStatusLabel({ computer }),
                computerResourcesLabel({ computer }),
                computer.description,
            ]
                .filter(Boolean)
                .join(" · ")}
        >
            {is_super_admin && computer.status == "failed" ? (
                <SettingsRowAction
                    title={`Set ${name} up again`}
                    label="Retry"
                    disabled={busy}
                    onClick={onRetry}
                />
            ) : null}
            {is_super_admin && computer.kind != "main" ? (
                <SettingsRowAction
                    title={`Delete ${name}; its files are kept`}
                    label="Delete"
                    disabled={busy_here}
                    onClick={onDelete}
                />
            ) : null}
        </SettingsListRow>
    );
}
