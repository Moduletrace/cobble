import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import Stack from "@moduletrace/twui/layout/Stack";
import BotPlanCard from "./bot-plan-card";

type Props = {
    plan_id: number;
    open: boolean;
    onClose: () => void;
};

/**
 * A plan opened away from where it was written: the same card the thread
 * shows, from the plan bar or a chip under a step's report, so the plan can
 * be read and moved on without scrolling back to it.
 */
export default function BotPlanModal({ plan_id, open, onClose }: Props) {
    return (
        <AddModalShell
            open={open}
            setOpen={(next) => {
                if (!next) onClose();
            }}
            title="Plan"
        >
            <Stack className="w-full gap-2! items-stretch">
                <BotPlanCard plan_id={plan_id} />
            </Stack>
        </AddModalShell>
    );
}