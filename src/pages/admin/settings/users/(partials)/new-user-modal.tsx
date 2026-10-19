import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import type { BUN_SQLITE_COBBLE_USERS_JOIN } from "@/src/types/sql-joins";
import UserForm from "./user-form";

type Props = {
    open: boolean;
    onClose: () => void;
    onSaved: (params: { person: BUN_SQLITE_COBBLE_USERS_JOIN; msg: string }) => void;
};

/**
 * Adds a user in a modal. Editing one happens on its settings page.
 */
export default function NewUserModal({ open, onClose, onSaved }: Props) {
    return (
        <AddModalShell
            open={open}
            setOpen={(next) => !next && onClose()}
            title="Add a user"
            description="They get their own coordinator and main computer, and sign in with this password."
        >
            {open ? <UserForm onCancel={onClose} onSaved={onSaved} /> : null}
        </AddModalShell>
    );
}
