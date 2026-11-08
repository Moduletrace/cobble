import { useState } from "react";
import WorkspaceUserRoleModal from "@/src/components/general/workspace-user-role-modal";
import type { BUN_SQLITE_COBBLE_USER_TYPES, BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import type { WorkspaceUserRoles } from "@/src/types";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import parseIdList from "@/src/utils/parse-id-list";
import parseUserTypes from "@/src/utils/parse-user-types";
import personName from "@/src/utils/person-name";
import canSetWorkspaceUserRole from "@/src/utils/rbac/can-set-workspace-user-role";
import crewRole from "@/src/utils/rbac/crew-role";
import SettingsGroup from "../../../(partials)/settings-group";
import SettingsList from "../../../(partials)/settings-list";
import UserWorkspaceRoleRow from "./user-workspace-role-row";

type Props = {
    person: BUN_SQLITE_COBBLE_USERS_JOIN;
    /**
     * Every workspace on the install.
     */
    crew_workspaces: BUN_SQLITE_COBBLE_WORKSPACES[];
    /**
     * Their roles, keyed by workspace id.
     */
    roles: WorkspaceUserRoles;
    actor_user_types?: BUN_SQLITE_COBBLE_USER_TYPES[] | null;
};

/**
 * The user's role in each workspace they work in (every one for super
 * admins and admins, else the ones they were added to, kept in step with
 * the Workspaces group above): every bot there reads it when it works for
 * them. Only the super admin sets a super admin's.
 */
export default function UserWorkspaceRolesGroup({ person, crew_workspaces, roles: initial, actor_user_types }: Props) {
    const [roles, setRoles] = useState(initial);
    const [editing, setEditing] = useState<BUN_SQLITE_COBBLE_WORKSPACES>();

    const target_user_types = parseUserTypes({ user_types: person.user_types }).map((user_type) => ({ user_type }));

    if (target_user_types.some((type) => type.user_type == "revoked")) return null;

    const reaches_all = crewRole({ user_types: target_user_types }) != "member";
    const granted_ids = parseIdList({ ids: person.workspace_ids });
    const workspaces = reaches_all
        ? crew_workspaces
        : crew_workspaces.filter((workspace) => granted_ids.includes(Number(workspace.id)));
    const can_edit = canSetWorkspaceUserRole({ actor_user_types, target_user_types });
    const name = personName(person);

    return (
        <SettingsGroup
            id="workspace-roles"
            title="Roles in workspaces"
            description={`Who ${name} is in each workspace: every bot there reads it when it works for them, to pitch its replies to them. It can differ from one workspace to the next. It's not their bio, and they don't see it.`}
        >
            <SettingsList is_empty={!workspaces.length} empty="They don't work in any workspace yet.">
                {workspaces.map((workspace) => (
                    <UserWorkspaceRoleRow
                        key={workspace.id}
                        workspace={workspace}
                        role={roles[String(workspace.id)]}
                        can_edit={can_edit}
                        onEdit={() => setEditing(workspace)}
                    />
                ))}
            </SettingsList>
            {editing ? (
                <WorkspaceUserRoleModal
                    workspace_id={Number(editing.id)}
                    workspace_name={editing.name || "this workspace"}
                    user_id={Number(person.id)}
                    person_name={name}
                    role={roles[String(editing.id)]}
                    onClose={() => setEditing(undefined)}
                    onSaved={(role) =>
                        setRoles((current) => {
                            const next = { ...current };

                            if (role) next[String(editing.id)] = role;
                            else delete next[String(editing.id)];

                            return next;
                        })
                    }
                />
            ) : null}
        </SettingsGroup>
    );
}
