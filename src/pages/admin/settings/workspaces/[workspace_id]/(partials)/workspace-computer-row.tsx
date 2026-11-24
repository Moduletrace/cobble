import { RefreshCw, Star, Trash2, Unlink } from "lucide-react";
import type { ComputerWithStatus } from "@/src/types";
import ComputerListRow from "@/src/pages/admin/settings/(partials)/computer-list-row";
import SettingsRowMenu from "@/src/pages/admin/settings/(partials)/settings-row-menu";
import SettingsRowMenuItem from "@/src/pages/admin/settings/(partials)/settings-row-menu-item";
import SettingsRowMenuPanel from "@/src/pages/admin/settings/(partials)/settings-row-menu-panel";

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
 * the default, then a menu with what can be done with it.
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
        <ComputerListRow
            computer={computer}
            badge={is_default ? "Default" : undefined}
        >
            <SettingsRowMenu title={`${name} menu`} disabled={busy}>
                <SettingsRowMenuPanel>
                    {is_default ? null : (
                        <SettingsRowMenuItem
                            icon={Star}
                            title="Make default"
                            description={`Make ${name} the default`}
                            onClick={onMakeDefault}
                        />
                    )}
                    {computer.status == "failed" && is_super_admin ? (
                        <SettingsRowMenuItem
                            icon={RefreshCw}
                            title="Retry"
                            description={`Set ${name} up again`}
                            onClick={onRetry}
                        />
                    ) : null}
                    <SettingsRowMenuItem
                        icon={Unlink}
                        title="Unlink"
                        description={`Unlink ${name}; it stays yours`}
                        onClick={onUnlink}
                    />
                    {is_super_admin && computer.kind != "main" ? (
                        <SettingsRowMenuItem
                            icon={Trash2}
                            title="Delete"
                            description={`Delete ${name}; its files are kept`}
                            onClick={onDelete}
                        />
                    ) : null}
                </SettingsRowMenuPanel>
            </SettingsRowMenu>
        </ComputerListRow>
    );
}