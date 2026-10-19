import AddComputerForm from "@/src/layouts/bots/(partials)/add-computer-form";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import type { ComputerWithStatus } from "@/src/types";

type Props = {
    /**
     * Open while set.
     */
    computer?: ComputerWithStatus;
    onClose: () => void;
    onUpdated: (params: { computer: ComputerWithStatus; msg: string }) => void;
};

/**
 * Edits a computer in a modal, with the same form as creating one.
 */
export default function ComputerEditModal({ computer, onClose, onUpdated }: Props) {
    return (
        <AddModalShell
            open={Boolean(computer)}
            setOpen={(open) => !open && onClose()}
            title={`Edit ${computer?.name || "the computer"}`}
            description="New CPUs or memory restart it with them. Its files stay."
        >
            {computer ? (
                <AddComputerForm key={computer.id} computer={computer} onCancel={onClose} onUpdated={onUpdated} />
            ) : null}
        </AddModalShell>
    );
}
