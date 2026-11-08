import { Pencil } from "lucide-react";
import RowIconButton from "@/src/components/general/row-icon-button";
import UserAvatar from "@/src/components/general/user-avatar";
import { UserTypes } from "@/src/dict/user-types-dict";
import type { WorkspacePerson } from "@/src/types";
import parseUserTypes from "@/src/utils/parse-user-types";
import personName from "@/src/utils/person-name";
import SettingsListRow from "../../../(partials)/settings-list-row";

type Props = {
    person: WorkspacePerson;
    /**
     * The person looking: shown as "You".
     */
    is_self?: boolean;
    /**
     * Whether the viewer sets their role (`canSetWorkspaceUserRole`).
     */
    can_edit: boolean;
    onEdit: () => void;
};

/**
 * Someone who works in the workspace: their user type, their role here
 * (or that they have none), and the button that sets it.
 */
export default function WorkspacePersonRow({ person, is_self, can_edit, onEdit }: Props) {
    const name = personName(person);
    const user_types = parseUserTypes({ user_types: person.user_types });
    const manager_type = UserTypes.find(
        (type) => (type.value == "super_admin" || type.value == "admin") && user_types.includes(type.value),
    );
    const role = person.role?.trim().split("\n")[0];

    return (
        <SettingsListRow
            avatar={<UserAvatar person={{ id: person.id, profile_media_id: person.profile_media_id || undefined, first_name: person.first_name || "", last_name: person.last_name || "" }} />}
            title={name}
            href={`/admin/settings/users/${person.id}`}
            badge={[is_self ? "You" : "", manager_type?.title || ""].filter(Boolean).join(" · ") || undefined}
            subtitle={role || "No role here yet"}
        >
            {can_edit ? <RowIconButton icon={Pencil} title={`${name}'s role here`} onClick={onEdit} /> : null}
        </SettingsListRow>
    );
}
