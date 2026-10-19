import { useContext, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import { Plus } from "lucide-react";
import { AppContext } from "@/src/pages/__root";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import canCreateUser from "@/src/utils/rbac/can-create-user";
import useSettingsList from "../../(hooks)/use-settings-list";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsList from "../../(partials)/settings-list";
import SettingsStatus from "../../(partials)/settings-status";
import UserEditModal from "../(partials)/user-edit-modal";
import UserSettingsRow from "../(partials)/user-settings-row";

/**
 * Everyone who can sign in (for super admins and admins): add a user
 * with a password, edit one (name, email, username, a new password, user
 * types), or delete one with everything that's theirs. What each person
 * may do here is the RBAC helpers' call.
 */
export default function UsersSettingsSection() {
    const { pageProps } = useContext(AppContext);
    const { items, setItems, busy, status, setStatus, remove } = useSettingsList({ items: pageProps?.persons || [] });
    /**
     * The user being edited, or `true` while adding one.
     */
    const [editing, setEditing] = useState<BUN_SQLITE_COBBLE_USERS_JOIN | true>();

    return (
        <SettingsGroup
            title="People"
            description="Sign in is by email or username and password, so set one for each new user."
        >
            <SettingsList is_empty={!items.length} empty="No users yet.">
                {items.map((person) => (
                    <UserSettingsRow
                        key={person.id}
                        person={person}
                        actor_user_id={pageProps?.user?.id}
                        actor_user_types={pageProps?.user_types}
                        busy={busy}
                        onEdit={() => setEditing(person)}
                        onDelete={() =>
                            remove({
                                id: person.id,
                                path: "users/delete-user",
                                body: { user_id: person.id },
                                confirm: `Delete ${person.first_name || "this user"} with their bots, workspaces and computers? Their computers' files stay on disk.`,
                            })
                        }
                    />
                ))}
            </SettingsList>
            {canCreateUser({ user_types: pageProps?.user_types }) ? (
            <Button
                title="Add a user"
                type="button"
                variant="ghost"
                color="gray"
                size="small"
                onClick={() => setEditing(true)}
                className="self-start gap-1!"
            >
                <Plus size={14} aria-hidden />
                New user
            </Button>
            ) : null}
            <SettingsStatus status={status} />
            <UserEditModal
                person={editing === true ? undefined : editing}
                open={Boolean(editing)}
                onClose={() => setEditing(undefined)}
                onSaved={({ person, msg }) => {
                    setItems((prev) =>
                        prev.some((p) => p.id == person.id)
                            ? prev.map((p) => (p.id == person.id ? person : p))
                            : [...prev, person],
                    );
                    setEditing(undefined);
                    setStatus({ success: true, msg });
                }}
            />
        </SettingsGroup>
    );
}
