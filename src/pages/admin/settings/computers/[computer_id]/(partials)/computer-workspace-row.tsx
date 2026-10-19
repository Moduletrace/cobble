import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import SettingsListRow from "../../../(partials)/settings-list-row";
import SettingsRowAction from "../../../(partials)/settings-row-action";

type Props = {
    workspace: BUN_SQLITE_COBBLE_WORKSPACES;
    busy?: boolean;
    onRemove: () => void;
};

/**
 * One workspace linked to the computer, where every bot in it can use the
 * computer.
 */
export default function ComputerWorkspaceRow({
    workspace,
    busy,
    onRemove,
}: Props) {
    const name = workspace.name || `Workspace ${workspace.id}`;

    return (
        <SettingsListRow
            avatar={
                <WorkspaceAvatar
                    image_media_id={workspace.image_media_id}
                    size="sm"
                />
            }
            href={`/admin/settings/workspaces/${workspace.id}`}
            title={name}
            subtitle={workspace.description || "Every bot here can use this computer"}
        >
            <SettingsRowAction
                title={`Unlink ${name} from this computer`}
                label="Remove"
                disabled={busy}
                onClick={onRemove}
            />
        </SettingsListRow>
    );
}
