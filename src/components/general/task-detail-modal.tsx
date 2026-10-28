import { useEffect, useState } from "react";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { TaskDetail, TaskWithNames } from "@/src/types";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import taskPlaceLabel from "@/src/utils/task-place-label";
import TaskDetailPanel from "./task-detail-panel";

type Props = {
    /**
     * The list row clicked; open while set. Its notes and files load when
     * it opens, so the list stays small.
     */
    task?: TaskWithNames | null;
    /**
     * A crew manager can change it, file onto it and delete it.
     */
    can_manage?: boolean;
    onClose: () => void;
    onChanged: (params: { task: TaskDetail; msg?: string }) => void;
    onDeleted: (params: { task_id: number }) => void;
};

/**
 * A task opened from a list in a modal of its own: everything about it, and
 * for a crew manager its edit, hand-over, files and delete.
 */
export default function TaskDetailModal({ task, can_manage, onClose, onChanged, onDeleted }: Props) {
    const [detail, set_detail] = useState<TaskDetail | null>(null);
    const [error, set_error] = useState<string>();
    const task_id = task?.id ? Number(task.id) : 0;

    useEffect(() => {
        set_detail(null);
        set_error(undefined);

        if (!task_id) return;

        let live = true;

        fetchApi<{}, APIResponseObject<TaskDetail>>(`/api/admin/tasks/get-task?task_id=${task_id}`, {
            method: "GET",
        })
            .catch(() => null)
            .then((res) => {
                if (!live) return;

                if (!res?.success || !res.singleRes) {
                    set_error(res?.msg || "Couldn't open the task.");
                    return;
                }

                set_detail(res.singleRes);
            });

        return () => {
            live = false;
        };
    }, [task_id]);

    const shown = detail || task;

    return (
        <AddModalShell
            open={Boolean(task_id)}
            setOpen={(open) => !open && onClose()}
            title={shown?.title || (task_id ? `Task ${task_id}` : "Task")}
            description={shown ? taskPlaceLabel({ task: shown }) : undefined}
        >
            <Stack className="w-full mt-4 gap-0! items-stretch">
                {detail ? (
                    <TaskDetailPanel
                        key={detail.id}
                        task={detail}
                        can_manage={can_manage}
                        onChanged={(saved, msg) => {
                            set_detail(saved);
                            onChanged({ task: saved, msg });
                        }}
                        onDeleted={() => onDeleted({ task_id })}
                    />
                ) : (
                    <Span className="py-6 text-[13px] leading-[18px] text-ink-secondary">
                        {error || "Loading the task..."}
                    </Span>
                )}
            </Stack>
        </AddModalShell>
    );
}
