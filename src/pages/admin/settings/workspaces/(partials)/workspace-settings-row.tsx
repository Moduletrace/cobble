import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import type { WorkspaceWithActivity } from "@/src/types";
import SettingsListRow from "../../(partials)/settings-list-row";
import SettingsRowAction from "../../(partials)/settings-row-action";

type Props = {
    workspace: WorkspaceWithActivity;
    busy?: boolean;
    onDelete: () => void;
};

/**
 * One workspace: its picture, name and what it's about, then Open and
 * Delete.
 */
export default function WorkspaceSettingsRow({ workspace, busy, onDelete }: Props) {
    const name = workspace.name || `Workspace ${workspace.id}`;

    return (
        <SettingsListRow
            avatar={<WorkspaceAvatar image_media_id={workspace.image_media_id} size="sm" />}
            href={`/admin/settings/workspaces/${workspace.id}`}
            title={name}
            subtitle={workspace.description || undefined}
        >
            <SettingsRowAction title={`Delete ${name}`} label="Delete" disabled={busy} onClick={onDelete} />
        </SettingsListRow>
    );
}
