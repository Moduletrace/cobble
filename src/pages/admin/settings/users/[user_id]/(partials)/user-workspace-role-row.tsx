import { Pencil } from "lucide-react";
import RowIconButton from "@/src/components/general/row-icon-button";
import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import SettingsListRow from "../../../(partials)/settings-list-row";

type Props = {
    workspace: BUN_SQLITE_COBBLE_WORKSPACES;
    /**
     * Their role there, if one was set.
     */
    role?: string | null;
    can_edit: boolean;
    onEdit: () => void;
};

/**
 * A workspace the user works in, with their role there (or that they have
 * none), and the button that sets it.
 */
export default function UserWorkspaceRoleRow({ workspace, role, can_edit, onEdit }: Props) {
    const name = workspace.name || `Workspace ${workspace.id}`;

    return (
        <SettingsListRow
            avatar={<WorkspaceAvatar image_media_id={workspace.image_media_id} />}
            title={name}
            href={`/admin/settings/workspaces/${workspace.id}#people`}
            subtitle={role?.trim().split("\n")[0] || "No role there yet"}
        >
            {can_edit ? <RowIconButton icon={Pencil} title={`Their role in ${name}`} onClick={onEdit} /> : null}
        </SettingsListRow>
    );
}
