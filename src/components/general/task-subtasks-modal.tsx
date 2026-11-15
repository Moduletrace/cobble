import Stack from "@moduletrace/twui/layout/Stack";
import { OpenTaskStatuses } from "@/src/dict/task-dict";
import type { TaskWithNames } from "@/src/types";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import TaskSubtaskRow from "./task-subtask-row";

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
    /**
     * The workspace-wide task they belong to.
     */
    task: TaskWithNames;
    /**
     * Every subtask of it, in the order the task keeps them.
     */
    subtasks: TaskWithNames[];
    /**
     * Opens one of them in the task modal.
     */
    onOpenSubtask: (subtask: TaskWithNames) => void;
};

/**
 * Every subtask of a workspace-wide task: the whole list, when the task itself
 * only shows the first few.
 */
export default function TaskSubtasksModal({ open, setOpen, task, subtasks, onOpenSubtask }: Props) {
    const open_parts = subtasks.filter((subtask) => (OpenTaskStatuses as readonly string[]).includes(subtask.status || ""))
        .length;
    const count = `${subtasks.length} subtask${subtasks.length == 1 ? "" : "s"}`;

    return (
        <AddModalShell
            open={open}
            setOpen={setOpen}
            title={`Subtasks of task #${task.id}`}
            description={`${task.title ? `"${task.title}": ` : ""}${count}, ${open_parts ? `${open_parts} still open` : "all done"}. Each one is a bot's own task, and the parent stays open until someone verifies them.`}
        >
            <Stack className="w-full mt-4 max-h-[50vh] gap-0! items-stretch overflow-y-auto">
                {subtasks.map((subtask) => (
                    <TaskSubtaskRow key={subtask.id} subtask={subtask} onOpen={() => onOpenSubtask(subtask)} />
                ))}
            </Stack>
        </AddModalShell>
    );
}