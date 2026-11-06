import { useContext, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import { ListChecks } from "lucide-react";
import TaskDetailModal from "@/src/components/general/task-detail-modal";
import { AppContext } from "@/src/pages/__root";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";

type Props = {
    task_id: number;
};

/**
 * A task on the tracker named in a message (`taskRef`): a chip that opens
 * the task in its own modal, read when it opens. One the user doesn't
 * reach says so there.
 */
export default function TaskRefChip({ task_id }: Props) {
    const { pageProps } = useContext(AppContext);
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState<string>();
    const [deleted, setDeleted] = useState(false);
    const label = title ? `#${task_id} ${title}` : `Task ${task_id}`;

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                title={deleted ? "This task was deleted" : "Open the task"}
                disabled={deleted}
                onClick={() => setOpen(true)}
                className="inline-flex h-6 max-w-full gap-1.5! flex-nowrap items-center px-1.5! py-0! align-middle rounded-default-xs border-0 bg-sunken text-[13px] font-bold leading-4 text-ink whitespace-nowrap hover:opacity-80 [&_.twui-button-content-wrapper]:min-w-0"
            >
                <ListChecks size={13} aria-hidden className="shrink-0" />
                <Span className="min-w-0 truncate">{deleted ? `Task ${task_id} (deleted)` : label}</Span>
            </Button>
            <TaskDetailModal
                task={open ? { id: task_id } : null}
                can_manage={canManageCrew({ user_types: pageProps?.user_types })}
                onClose={() => setOpen(false)}
                onLoaded={({ task }) => setTitle(task.title || undefined)}
                onChanged={({ task }) => setTitle(task.title || undefined)}
                onDeleted={() => {
                    setDeleted(true);
                    setOpen(false);
                }}
            />
        </>
    );
}
