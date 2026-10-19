import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import UserForm from "@/src/pages/admin/people/create/(partials)/user-form";

type Props = {
    /**
     * Edits this user; adds one when not given.
     */
    person?: BUN_SQLITE_COBBLE_USERS_JOIN;
    open: boolean;
    onClose: () => void;
    onSaved: (params: { person: BUN_SQLITE_COBBLE_USERS_JOIN; msg: string }) => void;
};

/**
 * Adds or edits a user in a modal.
 */
export default function UserEditModal({ person, open, onClose, onSaved }: Props) {
    return (
        <AddModalShell
            open={open}
            setOpen={(next) => !next && onClose()}
            title={person ? `Edit ${person.first_name || "the user"}` : "Add a user"}
            description={
                person
                    ? "Leave the password empty to keep theirs."
                    : "They get their own coordinator and main computer, and sign in with this password."
            }
        >
            {open ? <UserForm key={person?.id || "new"} person={person} onCancel={onClose} onSaved={onSaved} /> : null}
        </AddModalShell>
    );
}
