import { useState } from "react";
import WorkspaceUserRoleModal from "@/src/components/general/workspace-user-role-modal";
import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import type { WorkspacePerson } from "@/src/types";
import parseUserTypes from "@/src/utils/parse-user-types";
import personName from "@/src/utils/person-name";
import canSetWorkspaceUserRole from "@/src/utils/rbac/can-set-workspace-user-role";
import SettingsGroup from "../../../(partials)/settings-group";
import SettingsList from "../../../(partials)/settings-list";
import WorkspacePersonRow from "./workspace-person-row";

type Props = {
    workspace_id: number;
    workspace_name: string;
    /**
     * Everyone who works here (`grabWorkspacePeople`).
     */
    people: WorkspacePerson[];
    actor_user_id?: number | string | "";
    actor_user_types?: BUN_SQLITE_COBBLE_USER_TYPES[] | null;
};

/**
 * Who works in this workspace and each one's role here, which every bot
 * here reads when it works for them. Super admins and admins work in every
 * workspace; members are added on their own settings page. Only the super
 * admin sets a super admin's role.
 */
export default function WorkspacePeopleGroup({
    workspace_id,
    workspace_name,
    people: initial,
    actor_user_id,
    actor_user_types,
}: Props) {
    const [people, setPeople] = useState(initial);
    const [editing, setEditing] = useState<WorkspacePerson>();

    const saved = ({ user_id, role }: { user_id: number; role: string | null }) =>
        setPeople((current) => current.map((person) => (person.id == user_id ? { ...person, role } : person)));

    return (
        <SettingsGroup
            id="people"
            title="People"
            description="Who works here, and each one's role here: every bot in this workspace reads it when it works for them, to pitch its replies to them. It's not their bio, and they don't see it. Add members to a workspace on their own settings page."
        >
            <SettingsList is_empty={!people.length} empty="Nobody works here yet.">
                {people.map((person) => (
                    <WorkspacePersonRow
                        key={person.id}
                        person={person}
                        is_self={String(person.id) == String(actor_user_id)}
                        can_edit={canSetWorkspaceUserRole({
                            actor_user_types,
                            target_user_types: parseUserTypes({ user_types: person.user_types }).map((user_type) => ({
                                user_type,
                            })),
                        })}
                        onEdit={() => setEditing(person)}
                    />
                ))}
            </SettingsList>
            {editing ? (
                <WorkspaceUserRoleModal
                    workspace_id={workspace_id}
                    workspace_name={workspace_name}
                    user_id={Number(editing.id)}
                    person_name={personName(editing)}
                    role={editing.role}
                    onClose={() => setEditing(undefined)}
                    onSaved={(role) => saved({ user_id: Number(editing.id), role })}
                />
            ) : null}
        </SettingsGroup>
    );
}
