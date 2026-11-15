import { useEffect, useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import Select from "@moduletrace/twui/form/Select";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import type { TaskDetail, TaskWithNames } from "@/src/types";

type Props = {
    /**
     * The bot's task being made a subtask of a workspace-wide one.
     */
    task: TaskDetail;
    onLinked: (task: TaskDetail, msg: string) => void;
    onCancel: () => void;
};

/**
 * Picks which open workspace-wide task of the same workspace a bot's task
 * becomes a subtask of (`linkSubtask`), the way the task's own bot can with
 * `update_task`. The parents load when the form opens, so the page's props
 * stay small.
 */
export default function SubtaskLinkForm({ task, onLinked, onCancel }: Props) {
    const [parents, setParents] = useState<TaskWithNames[]>();
    const [parent_task_id, setParentTaskId] = useState<number>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    useEffect(() => {
        postAdminApi<TaskWithNames>({ path: "tasks/subtask-parents", body: { task_id: Number(task.id) } }).then((res) => {
            if (!res.success) {
                setError(res.msg || "Couldn't load the workspace-wide tasks.");
                setParents([]);
                return;
            }

            const list = (res.payload || []) as TaskWithNames[];

            setParents(list);
            setParentTaskId(list[0]?.id ? Number(list[0].id) : undefined);
        });
    }, []);

    const submit = async () => {
        if (loading) return;

        const parent = parents?.find((it) => Number(it.id) == parent_task_id);

        if (!parent) {
            setError("Pick the workspace-wide task it belongs to.");
            return;
        }

        if (!window.confirm(`Make "${task.title}" a subtask of "${parent.title}"? It stays ${task.bot_name || "its bot"}'s, and the parent stays open until someone verifies all its subtasks.`))
            return;

        setLoading(true);
        setError(undefined);

        const res = await postAdminApi<TaskDetail>({
            path: "tasks/link-subtask",
            body: { task_id: Number(task.id), parent_task_id: Number(parent.id) },
        });

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Couldn't make it a subtask of that task.");
            return;
        }

        onLinked(res.singleRes, res.msg || `It's a subtask of task #${parent.id} now.`);
    };

    return (
        <Form onSubmit={submit} className="w-full gap-3! items-stretch">
            <Stack className="gap-3! items-stretch">
                {!parents ? (
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">Loading the workspace-wide tasks...</Span>
                ) : parents.length ? (
                    <Select
                        key={parents.length}
                        label="Parent task"
                        showLabel
                        options={parents.map((it) => ({
                            title: `#${it.id} ${it.title || ""}`.trim(),
                            value: String(it.id),
                            default: Number(it.id) == parent_task_id,
                        }))}
                        changeHandler={(value) => setParentTaskId(Number(value))}
                    />
                ) : (
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                        This workspace has no open workspace-wide task to join. Make one first, then split it.
                    </Span>
                )}
                <AddFormActions submit_label="Make it a subtask" loading={loading} error={error} onCancel={onCancel} />
            </Stack>
        </Form>
    );
}