import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import type { CronJobWithNames } from "@/src/types";
import RoutineForm from "./routine-form";

type Props = {
    /**
     * Open while set.
     */
    cron_job?: CronJobWithNames;
    onClose: () => void;
    onSaved: (params: { cron_job: CronJobWithNames }) => void;
};

/**
 * Edits a routine in a modal: its name, schedule and brief.
 */
export default function RoutineEditModal({ cron_job, onClose, onSaved }: Props) {
    return (
        <AddModalShell
            open={Boolean(cron_job)}
            setOpen={(open) => !open && onClose()}
            title={`Edit ${cron_job?.title || "the routine"}`}
            description={`${cron_job?.bot_name || "The bot"} gets the brief as a task at every run.`}
        >
            {cron_job ? <RoutineForm key={cron_job.id} cron_job={cron_job} onCancel={onClose} onSaved={onSaved} /> : null}
        </AddModalShell>
    );
}
