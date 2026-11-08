import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import WorkspaceUserRoleForm from "./workspace-user-role-form";

type Props = {
    workspace_id: number;
    workspace_name: string;
    user_id: number;
    person_name: string;
    role?: string | null;
    onClose: () => void;
    onSaved: (role: string | null) => void;
};

/**
 * Who a user is in one workspace, which every bot there reads when it
 * works for them. Separate from their bio, which is theirs to write.
 * Opened from the workspace's settings and from the user's.
 */
export default function WorkspaceUserRoleModal({
    workspace_id,
    workspace_name,
    user_id,
    person_name,
    role,
    onClose,
    onSaved,
}: Props) {
    return (
        <AddModalShell
            open
            setOpen={(open) => !open && onClose()}
            title={`${person_name} in ${workspace_name}`}
            description={`Their role and anything the bots should know about them in this workspace, to pitch their replies to them. A user can have a different role in each workspace.`}
        >
            <WorkspaceUserRoleForm
                workspace_id={workspace_id}
                workspace_name={workspace_name}
                user_id={user_id}
                person_name={person_name}
                role={role}
                onCancel={onClose}
                onSaved={(saved) => {
                    onSaved(saved);
                    onClose();
                }}
            />
        </AddModalShell>
    );
}
