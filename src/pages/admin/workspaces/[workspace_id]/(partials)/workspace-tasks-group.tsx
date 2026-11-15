import { useContext, useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import { OpenTaskStatuses } from "@/src/dict/task-dict";
import type { TaskDetail, TaskWithNames } from "@/src/types";
import TaskDetailModal from "@/src/components/general/task-detail-modal";
import TaskForm from "@/src/components/general/task-form";
import TaskListItem from "@/src/components/general/task-list-item";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";
import SettingsList from "@/src/pages/admin/settings/(partials)/settings-list";
import SettingsStatus from "@/src/pages/admin/settings/(partials)/settings-status";
import { AppContext } from "@/src/pages/__root";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import compareTasks from "@/src/utils/task-sections/compare-tasks";
import shownWorkspaceTasks from "@/src/utils/task-sections/shown-workspace-tasks";
import WorkspaceTasksModal from "@/src/pages/admin/workspaces/[workspace_id]/(partials)/workspace-tasks-modal";

type Props = {
    workspace_id: number;
    /**
     * Its tasks, open first.
     */
    tasks: TaskWithNames[];
    /**
     * The bots working there, to pick who has a new task.
     */
    bots: { id?: number | string | null; name?: string | null }[];
};

/**
 * Every task in a workspace, whichever bot has it: a task belongs to one
 * bot, which sees only its own, unless it's workspace-wide (every bot there
 * sees it; the workspace's admin bot sees all). The list starts with the
 * workspace-wide ones, then each bot's, and shows only the first few: the
 * rest are a click away in View all.
 * Add and change one by hand here; the bots
 * keep it up to date themselves as they work.
 */
export default function WorkspaceTasksGroup({ workspace_id, tasks, bots }: Props) {
    const { pageProps } = useContext(AppContext);
    const [items, setItems] = useState(tasks);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState<{ error?: boolean; success?: boolean; msg: string }>();
    const [adding, setAdding] = useState(false);
    const [showing_all, setShowingAll] = useState(false);
    const [open_task, setOpenTask] = useState<TaskWithNames | null>(null);
    const can_manage = canManageCrew({ user_types: pageProps?.user_types });

    /**
     * What the page lists: the order the all-tasks modal uses, cut to
     * `AppData.TaskSectionShown` rows.
     */
    const shown = shownWorkspaceTasks({ tasks: items });

    /**
     * The workspace-wide tasks here a new task can be a subtask of: the open
     * ones, a closed task having nothing left to split.
     */
    const parents = items
        .filter(
            (task) =>
                !task.bot_id &&
                Boolean(task.workspace_id) &&
                (OpenTaskStatuses as readonly string[]).includes(task.status || ""),
        )
        .map((task) => ({ id: task.id, title: task.title }));

    const replace = ({ task }: { task: TaskWithNames }) =>
        setItems((prev) => [task, ...prev.filter((item) => item.id != task.id)].sort(compareTasks));

    /**
     * Reads the workspace's tasks again: one change can move more than the
     * task that was open, since a subtask joining or leaving reshapes its
     * parent's counts.
     */
    const refresh = async () => {
        const res = await fetchApi<Record<string, unknown>, APIResponseObject<TaskWithNames>>(
            `/api/admin/tasks/list-tasks?workspace_id=${workspace_id}`,
            { method: "GET" },
        );

        if (res.success && res.payload) setItems(res.payload);
    };

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

    const remove = async ({ task }: { task: TaskWithNames }) => {
        if (busy) return;
        if (!window.confirm(`Delete "${task.title || `task ${task.id}`}"? Its notes and links go with it.`)) return;

        setBusy(true);
        setStatus(undefined);

        const res = await fetchApi<Record<string, unknown>, APIResponseObject>(
            "/api/admin/tasks/delete-task",
            { method: "POST", body: { task_id: Number(task.id) } },
        );

        setBusy(false);

        if (!res.success) {
            setStatus({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        setItems((prev) => prev.filter((item) => item.id != task.id));
        setStatus({ success: true, msg: "Task deleted." });
    };

    return (
        <SettingsGroup
            id="tasks"
            title="Tasks"
            description="Every task in this workspace, whichever bot has it. Each bot sees its own and the workspace-wide ones, which every bot here works on and logs; the workspace's admin bot and the coordinator see them all."
        >
            <Stack className="w-full gap-2! items-stretch">
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
                    {shown.map((task) => (
                        <TaskListItem
                            key={task.id}
                            task={task}
                            busy={busy}
                            onOpen={() => setOpenTask(task)}
                            onStatusChange={(next) => move({ task, next })}
                            onDelete={() => remove({ task }).catch(() => {})}
                        />
                    ))}
                </SettingsList>
                {items.length > shown.length ? (
                    <Row className="justify-end">
                        <Button
                            title="Every task in this workspace, the workspace-wide ones first"
                            type="button"
                            variant="ghost"
                            color="gray"
                            size="small"
                            onClick={() => setShowingAll(true)}
                            className="px-2! text-[12px]"
                        >
                            View all {items.length} tasks
                        </Button>
                    </Row>
                ) : null}
                <SettingsStatus status={status} />
            </Stack>
            <WorkspaceTasksModal
                open={showing_all}
                setOpen={setShowingAll}
                tasks={items}
                onOpenTask={(task) => setOpenTask(task)}
            />
            <TaskDetailModal
                task={open_task}
                can_manage={can_manage}
                onClose={() => setOpenTask(null)}
                onChanged={({ task, msg }) => {
                    replace({ task });
                    setStatus(msg ? { success: true, msg } : undefined);
                    refresh().catch(() => {});
                }}
                onDeleted={({ task_id }) => {
                    setItems((prev) => prev.filter((item) => item.id != task_id));
                    setOpenTask(null);
                    setStatus({ success: true, msg: "Task deleted." });
                }}
            />
            <AddModalShell
                open={adding}
                setOpen={setAdding}
                title="Add a task"
                description="Pick the bot that has it, or make it workspace-wide: every bot here sees it, works on it and logs what it did. Hand it over later to give it to one bot. To split a workspace-wide task into pieces, add each piece with 'Part of' set to it: one bot per piece, and the parent stays open until you verify them."
            >
                <TaskForm
                    workspace_id={workspace_id}
                    bots={bots}
                    parents={parents}
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
