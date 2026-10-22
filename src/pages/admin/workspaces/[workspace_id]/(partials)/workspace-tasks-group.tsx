import { useContext, useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import type { TaskDetail, TaskWithNames } from "@/src/types";
import TaskDetailPanel from "@/src/components/general/task-detail-panel";
import TaskForm from "@/src/components/general/task-form";
import TaskListItem from "@/src/components/general/task-list-item";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";
import SettingsList from "@/src/pages/admin/settings/(partials)/settings-list";
import SettingsStatus from "@/src/pages/admin/settings/(partials)/settings-status";
import { AppContext } from "@/src/pages/__root";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";

type Props = {
    workspace_id: number;
    /**
     * Its tasks, open first.
     */
    tasks: TaskWithNames[];
};

/**
 * A workspace's shared to-do list: every bot working there sees these, and
 * the coordinator sees them all. Add and change one by hand here; the bots
 * keep it up to date themselves as they work.
 */
export default function WorkspaceTasksGroup({ workspace_id, tasks }: Props) {
    const { pageProps } = useContext(AppContext);
    const [items, setItems] = useState(tasks);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState<{ error?: boolean; success?: boolean; msg: string }>();
    const [adding, setAdding] = useState(false);
    const [open_task, setOpenTask] = useState<TaskDetail | null>(null);
    const can_manage = canManageCrew({ user_types: pageProps?.user_types });

    const replace = ({ task }: { task: TaskWithNames }) =>
        setItems((prev) => [task, ...prev.filter((item) => item.id != task.id)].sort(order));

    const move = async ({ task, next }: { task: TaskWithNames; next: string }) => {
        if (busy) return;

        setBusy(true);
        setStatus(undefined);

        const res = await fetchApi<Record<string, unknown>, APIResponseObject<TaskDetail>>(
            "/api/admin/tasks/save-task",
            { method: "POST", body: { task_id: Number(task.id), status: next } },
        );

        setBusy(false);

        if (!res.success || !res.singleRes) {
            setStatus({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        replace({ task: res.singleRes });
    };

    const show = async ({ task }: { task: TaskWithNames }) => {
        setStatus(undefined);

        const res = await fetchApi<{}, APIResponseObject<TaskDetail>>(
            `/api/admin/tasks/get-task?task_id=${task.id}`,
            { method: "GET" },
        ).catch(() => null);

        if (!res?.success || !res.singleRes) {
            setStatus({ error: true, msg: res?.msg || "Couldn't open the task." });
            return;
        }

        setOpenTask(res.singleRes);
    };

    return (
        <SettingsGroup
            id="tasks"
            title="Tasks"
            description="The workspace's shared to-do list. Every bot here sees it, and they keep it up to date as they work."
        >
            <Stack className="w-full gap-2! items-stretch">
                {open_task ? (
                    <Stack className="w-full gap-3! items-stretch">
                        <Row className="w-full gap-2! flex-nowrap items-center">
                            <Span className="grow min-w-0 text-sm font-bold leading-5 text-ink truncate">
                                {open_task.title || "Task"}
                            </Span>
                            <Button
                                title="Back to the list"
                                type="button"
                                variant="ghost"
                                color="gray"
                                size="small"
                                onClick={() => setOpenTask(null)}
                                className="px-2! text-[12px]"
                            >
                                Back
                            </Button>
                        </Row>
                        <TaskDetailPanel
                            task={open_task}
                            can_manage={can_manage}
                            onChanged={(saved, msg) => {
                                setOpenTask(saved);
                                replace({ task: saved });
                                setStatus(msg ? { success: true, msg } : undefined);
                            }}
                            onDeleted={() => {
                                setItems((prev) => prev.filter((item) => item.id != open_task.id));
                                setOpenTask(null);
                                setStatus({ success: true, msg: "Task deleted." });
                            }}
                        />
                    </Stack>
                ) : (
                    <>
                        {can_manage ? (
                            <Row className="justify-end">
                                <Button
                                    title="Add a task"
                                    type="button"
                                    variant="outlined"
                                    color="gray"
                                    size="small"
                                    onClick={() => setAdding(true)}
                                >
                                    Add task
                                </Button>
                            </Row>
                        ) : null}
                        <SettingsList is_empty={!items.length} empty="No tasks in this workspace yet.">
                            {items.map((task) => (
                                <TaskListItem
                                    key={task.id}
                                    task={task}
                                    busy={busy}
                                    onOpen={() => show({ task }).catch(() => {})}
                                    onStatusChange={(next) => move({ task, next })}
                                />
                            ))}
                        </SettingsList>
                    </>
                )}
                <SettingsStatus status={status} />
            </Stack>
            <AddModalShell
                open={adding}
                setOpen={setAdding}
                title="Add a task"
                description="It goes on the workspace's shared list, where every bot here can pick it up."
            >
                <TaskForm
                    workspace_id={workspace_id}
                    onCancel={() => setAdding(false)}
                    onSaved={(task, msg) => {
                        replace({ task });
                        setAdding(false);
                        setStatus({ success: true, msg });
                    }}
                />
            </AddModalShell>
        </SettingsGroup>
    );
}

/**
 * Blocked, then doing, then to do, then finished: the order a list reads
 * in.
 */
function order(a: TaskWithNames, b: TaskWithNames) {
    const rank = (task: TaskWithNames) =>
        task.status == "blocked" ? 0 : task.status == "doing" ? 1 : task.status == "todo" ? 2 : 3;
    const diff = rank(a) - rank(b);

    return diff != 0 ? diff : Number(b.updated_at || b.id || 0) - Number(a.updated_at || a.id || 0);
}
