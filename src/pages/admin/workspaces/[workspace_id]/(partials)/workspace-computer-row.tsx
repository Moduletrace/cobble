import ComputerIconTile from "@/src/components/general/computer-icon-tile";
import SettingsListRow from "@/src/pages/admin/settings/(partials)/settings-list-row";
import SettingsRowAction from "@/src/pages/admin/settings/(partials)/settings-row-action";
import type { ComputerWithStatus } from "@/src/types";
import computerStatusLabel from "@/src/utils/computer-status-label";

type Props = {
    computer: ComputerWithStatus;
    is_default: boolean;
    is_super_admin: boolean;
    busy?: boolean;
    onMakeDefault: () => void;
    onUnlink: () => void;
    onRetry: () => void;
    onDelete: () => void;
};

/**
 * A computer linked to the workspace: its name, state and whether it's
 * the default, then what can be done with it.
 */
export default function WorkspaceComputerRow({
    computer,
    is_default,
    is_super_admin,
    busy,
    onMakeDefault,
    onUnlink,
    onRetry,
    onDelete,
}: Props) {
    const name = computer.name || `Computer ${computer.id}`;

    return (
        <SettingsListRow
            avatar={<ComputerIconTile />}
            title={name}
            badge={is_default ? "Default" : undefined}
            subtitle={`${computerStatusLabel({ computer })}${computer.description ? ` · ${computer.description}` : ""}`}
        >
            {is_default ? null : (
                <SettingsRowAction title={`Make ${name} the default`} label="Make default" disabled={busy} onClick={onMakeDefault} />
            )}
            {computer.status == "failed" && is_super_admin ? (
                <SettingsRowAction title={`Set ${name} up again`} label="Retry" disabled={busy} onClick={onRetry} />
            ) : null}
            <SettingsRowAction title={`Unlink ${name}; it stays yours`} label="Unlink" disabled={busy} onClick={onUnlink} />
            {is_super_admin && computer.kind != "main" ? (
                <SettingsRowAction title={`Delete ${name}; its files are kept`} label="Delete" disabled={busy} onClick={onDelete} />
            ) : null}
        </SettingsListRow>
    );
}
