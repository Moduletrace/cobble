import { useContext, useEffect, useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import { ListChecks } from "lucide-react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import type { BotWithLastMessage, TaskDetail, TaskWithNames } from "@/src/types";
import TaskDetailModal from "@/src/components/general/task-detail-modal";
import TaskForm from "@/src/components/general/task-form";
import TaskListItem from "@/src/components/general/task-list-item";

import { AppContext } from "@/src/pages/__root";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import useBotTasks from "../(hooks)/use-bot-tasks";
import HeaderMenuItem from "./header-menu-item";

type Props = {
    bot: BotWithLastMessage;
    workspace?: BUN_SQLITE_COBBLE_WORKSPACES | null;
    /**
     * A row in the conversation header's menu instead of an icon beside it.
     */
    menu?: boolean;
    on_open?: () => void;
};

/**
 * The tasks this conversation works on: a bot's own list, or in a workspace
 * the ones it has there. Open it from the header menu; the list loads
 * then, so the page's props stay small. A crew manager adds, moves, edits
 * and deletes; a card opens the task in a modal of its own with everything
 * about it.
 */
export default function BotTasksModal({ bot, workspace, menu, on_open }: Props) {
    const { pageProps } = useContext(AppContext);
    const [open, setOpen] = useState(false);
    const [adding, set_adding] = useState(false);
    const [open_task, set_open_task] = useState<TaskWithNames | null>(null);
    const [busy, set_busy] = useState(false);
    const [status, set_status] = useState<string>();
    const can_manage = canManageCrew({ user_types: pageProps?.user_types });
    const { tasks, setTasks, loading, error, reload } = useBotTasks({
        bot_id: Number(bot.id),
        workspace_id: workspace?.id ? Number(workspace.id) : null,
        enabled: open,
    });

    const name = bot.name || "This bot";
    const title = workspace?.id ? `${name}'s tasks in ${workspace.name || "this workspace"}` : `${name}'s tasks`;

    useEffect(() => {
        if (open) on_open?.();
    }, [open]);

    const replace = ({ task }: { task: TaskWithNames }) =>
        setTasks((prev) => [task, ...prev.filter((item) => item.id != task.id)]);

    const move = async ({ task, next }: { task: TaskWithNames; next: string }) => {
        if (busy) return;

        set_busy(true);
        set_status(undefined);

        const res = await fetchApi<Record<string, unknown>, APIResponseObject<TaskDetail>>(
            "/api/admin/tasks/save-task",
            { method: "POST", body: { task_id: Number(task.id), status: next } },
        );

        set_busy(false);

        if (!res.success || !res.singleRes) {
            set_status(res.msg || "That didn't work.");
            return;
        }

        replace({ task: res.singleRes });
    };

    const remove = async ({ task }: { task: TaskWithNames }) => {
        if (busy) return;
        if (!window.confirm(`Delete "${task.title || `task ${task.id}`}"? Its notes and links go with it.`)) return;

        set_busy(true);
        set_status(undefined);

        const res = await fetchApi<Record<string, unknown>, APIResponseObject>(
            "/api/admin/tasks/delete-task",
            { method: "POST", body: { task_id: Number(task.id) } },
        );

        set_busy(false);

        if (!res.success) {
            set_status(res.msg || "That didn't work.");
            return;
        }

        setTasks((prev) => prev.filter((item) => item.id != task.id));
        set_status("Task deleted.");
    };

    return (
        <Modal
            target={
                menu ? (
                    <HeaderMenuItem
                        icon={ListChecks}
                        title="Tasks"
                        description={title}
                        loading={loading}
                    />
                ) : (
                    <Button
                        title={title}
                        type="button"
                        variant="ghost"
                        color="text"
                        className="shrink-0 p-2! text-ink-secondary hover:text-ink hover:bg-sunken rounded-default"
                    >
                        <ListChecks size={18} aria-hidden />
                    </Button>
                )
            }
            targetWrapperProps={{ className: menu ? "w-full" : "shrink-0" }}
            open={open}
            setOpen={(next) => {
                setOpen(next);
                if (!next) {
                    set_open_task(null);
                    set_adding(false);
                }
            }}
            className="max-w-xl bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch">
                <Row className="w-full gap-2! flex-nowrap items-center">
                    <H2 className="grow text-lg! leading-6! tracking-normal! font-bold text-ink">
                        {title}
                    </H2>
                    {can_manage ? (
                        <Button
                            title="Add a task"
                            type="button"
                            variant="outlined"
                            color="gray"
                            size="small"
                            onClick={() => set_adding(true)}
                        >
                            Add task
                        </Button>
                    ) : null}
                </Row>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {workspace?.id
                        ? `What ${name} has in ${workspace.name || "this workspace"}. The workspace shows every bot's.`
                        : `What ${name} is working through, and what it's waiting on.`}
                </Span>
            </Stack>

            <Stack className="w-full mt-4 gap-0! items-stretch overflow-y-auto max-h-[55vh]">
                {adding ? (
                    <TaskForm
                        bot_id={Number(bot.id)}
                        workspace_id={workspace?.id ? Number(workspace.id) : null}
                        onCancel={() => set_adding(false)}
                        onSaved={(saved, msg) => {
                            replace({ task: saved });
                            set_adding(false);
                            set_status(msg);
                        }}
                    />
                ) : tasks.length ? (
                    tasks.map((task) => (
                        <TaskListItem
                            key={task.id}
                            task={task}
                            busy={busy}
                            onOpen={() => set_open_task(task)}
                            onStatusChange={(next) => move({ task, next })}
                            onDelete={() => remove({ task }).catch(() => {})}
                        />
                    ))
                ) : (
                    <Span className="py-6 text-[13px] leading-[18px] text-ink-secondary">
                        {loading ? "Loading tasks..." : error || "No tasks yet."}
                    </Span>
                )}
            </Stack>

            {status ? (
                <Span role="status" className="mt-3 text-[13px] leading-[18px] text-ink-secondary">
                    {status}
                </Span>
            ) : null}

            <TaskDetailModal
                task={open_task}
                can_manage={can_manage}
                onClose={() => set_open_task(null)}
                onChanged={({ task: saved, msg }) => {
                    set_status(msg);

                    /**
                     * Handed to another bot, it's that bot's now.
                     */
                    if (saved.bot_id && saved.bot_id != bot.id) {
                        setTasks((prev) => prev.filter((item) => item.id != saved.id));
                        set_open_task(null);
                        return;
                    }

                    replace({ task: saved });
                }}
                onDeleted={({ task_id }) => {
                    setTasks((prev) => prev.filter((item) => item.id != task_id));
                    set_open_task(null);
                    set_status("Task deleted.");
                }}
            />
        </Modal>
    );
}
