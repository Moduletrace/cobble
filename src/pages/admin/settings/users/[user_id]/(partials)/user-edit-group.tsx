import { useState } from "react";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import UserForm from "@/src/pages/admin/people/create/(partials)/user-form";
import SettingsGroup from "../../../(partials)/settings-group";
import SettingsStatus from "../../../(partials)/settings-status";

type Props = {
    person: BUN_SQLITE_COBBLE_USERS_JOIN;
    onSaved: (person: BUN_SQLITE_COBBLE_USERS_JOIN) => void;
};

/**
 * The user's profile, photo, user types, access and password, saved
 * together. The same form as adding one, embedded on the page.
 */
export default function UserEditGroup({ person, onSaved }: Props) {
    const [status, setStatus] = useState<{ success?: boolean; msg?: string }>();

    return (
        <SettingsGroup
            id="edit"
            title="Edit"
            description="Their photo, name, contact details, user types, what they reach and a new password."
        >
            <UserForm
                key={`${person.id}-${person.updated_at || ""}`}
                person={person}
                embedded
                onSaved={({ person: saved, msg }) => {
                    onSaved(saved);
                    setStatus({ success: true, msg });
                }}
            />
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}
