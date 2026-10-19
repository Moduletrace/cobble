import UserAvatar from "@/src/components/general/user-avatar";
import { UserTypes } from "@/src/dict/user-types-dict";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import type { BUN_SQLITE_COBBLE_USER_TYPES } from "@/db/types/db";
import parseUserTypes from "@/src/utils/parse-user-types";
import canRevokeUser from "@/src/utils/rbac/can-revoke-user";
import canUpdateUser from "@/src/utils/rbac/can-update-user";
import SettingsListRow from "../../(partials)/settings-list-row";
import SettingsRowAction from "../../(partials)/settings-row-action";

type Props = {
    person: BUN_SQLITE_COBBLE_USERS_JOIN;
    actor_user_id?: number | string;
    actor_user_types?: BUN_SQLITE_COBBLE_USER_TYPES[] | null;
    busy?: boolean;
    onEdit: () => void;
    onRevoke: () => void;
    onDelete: () => void;
};

/**
 * One user: their photo, name, user types and email, then Edit, Revoke
 * (not once revoked) and Delete where the actor may (`canUpdateUser`,
 * `canRevokeUser`; never revoking or deleting yourself).
 */
export default function UserSettingsRow({
    person,
    actor_user_id,
    actor_user_types,
    busy,
    onEdit,
    onRevoke,
    onDelete,
}: Props) {
    const name =
        [person.first_name, person.last_name].filter(Boolean).join(" ") ||
        person.email ||
        `User ${person.id}`;
    const user_types = parseUserTypes({ user_types: person.user_types });
    const types_title = UserTypes.filter((type) => user_types.includes(type.value))
        .map((type) => type.title)
        .join(", ");
    const is_self = person.id == actor_user_id;
    const target_user_types = user_types.map((user_type) => ({ user_type }));
    const can_edit = canUpdateUser({ actor_user_types, actor_user_id, target_user_id: person.id, target_user_types });
    const can_delete = !is_self && canRevokeUser({ user_types: actor_user_types, target_user_types });
    const can_revoke = can_delete && !user_types.includes("revoked");

    return (
        <SettingsListRow
            avatar={<UserAvatar person={person} size="md" />}
            title={name}
            badge={is_self ? "You" : undefined}
            subtitle={[types_title, person.email].filter(Boolean).join(" · ")}
        >
            {can_edit ? (
                <SettingsRowAction
                    title={`Edit ${name}`}
                    label="Edit"
                    disabled={busy}
                    onClick={onEdit}
                />
            ) : null}
            {can_revoke ? (
                <SettingsRowAction
                    title={`Revoke ${name}`}
                    label="Revoke"
                    disabled={busy}
                    onClick={onRevoke}
                />
            ) : null}
            {can_delete ? (
                <SettingsRowAction
                    title={`Delete ${name}`}
                    label="Delete"
                    disabled={busy}
                    onClick={onDelete}
                />
            ) : null}
        </SettingsListRow>
    );
}
