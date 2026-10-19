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
import NewUserModal from "../(partials)/new-user-modal";
import UserSettingsRow from "../(partials)/user-settings-row";
import revokeUser from "../(functions)/revoke-user";

/**
 * Everyone who can sign in (for super admins and admins). A row opens
 * that user's settings page; add one with a password, revoke one, or
 * delete one with everything that's theirs.
 */
export default function UsersSettingsSection() {
    const { pageProps } = useContext(AppContext);
    const { items, setItems, busy, setBusy, status, setStatus, remove } = useSettingsList({
        items: pageProps?.persons || [],
    });
    const [creating, setCreating] = useState(false);

    const savePerson = (person: BUN_SQLITE_COBBLE_USERS_JOIN) =>
        setItems((prev) =>
            prev.some((p) => p.id == person.id) ? prev.map((p) => (p.id == person.id ? person : p)) : [...prev, person],
        );

    const revoke = async (person: BUN_SQLITE_COBBLE_USERS_JOIN) => {
        if (busy || !window.confirm(`Revoke ${person.first_name || "this user"}? They can't sign in until Revoked is removed from their user types. Their crew and files are kept.`)) return;

        setBusy(true);
        setStatus(undefined);

        const res = await revokeUser({ person });

        setBusy(false);

        if (!res.success || !res.singleRes?.id) {
            setStatus({ error: true, msg: res.msg || "Couldn't revoke them." });
            return;
        }

        savePerson(res.singleRes);
        setStatus({ success: true, msg: `${person.first_name || "They"} can't sign in now.` });
    };

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
                        onRevoke={() => revoke(person)}
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
                    onClick={() => setCreating(true)}
                    className="self-start gap-1!"
                >
                    <Plus size={14} aria-hidden />
                    New user
                </Button>
            ) : null}
            <SettingsStatus status={status} />
            <NewUserModal
                open={creating}
                onClose={() => setCreating(false)}
                onSaved={({ person, msg }) => {
                    savePerson(person);
                    setCreating(false);
                    setStatus({ success: true, msg });
                }}
            />
        </SettingsGroup>
    );
}
