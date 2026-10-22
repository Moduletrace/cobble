import { useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Select from "@moduletrace/twui/form/Select";
import Textarea from "@moduletrace/twui/form/Textarea";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppData } from "@/src/data/app-data";
import { TaskStatuses, type TaskStatus } from "@/src/dict/task-dict";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import type { TaskDetail } from "@/src/types";

type Props = {
    /**
     * The list it's added to: a bot's own, or a workspace's.
     */
    bot_id?: number | null;
    workspace_id?: number | null;
    /**
     * Edits this task; adds one when not given.
     */
    task?: TaskDetail | null;
    onSaved: (task: TaskDetail, msg: string) => void;
    onCancel: () => void;
};

/**
 * The one task form: a title, the brief, the status and, while it's
 * blocked, what the user has to do. The workspace's tasks group and the
 * conversation's tasks modal both add and edit with it.
 */
export default function TaskForm({ bot_id, workspace_id, task, onSaved, onCancel }: Props) {
    const [title, setTitle] = useState(task?.title || "");
    const [description, setDescription] = useState(task?.description || "");
    const [status, setStatus] = useState<TaskStatus>((task?.status as TaskStatus) || "todo");
    const [blocked_reason, setBlockedReason] = useState(task?.blocked_reason || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const submit = async () => {
        if (loading) return;

        if (!title.trim()) {
            setError("A task needs a title.");
            return;
        }

        setLoading(true);
        setError(undefined);

        const res = await fetchApi<Record<string, unknown>, APIResponseObject<TaskDetail>>(
            "/api/admin/tasks/save-task",
            {
                method: "POST",
                body: {
                    task_id: task?.id ? Number(task.id) : undefined,
                    bot_id: task ? undefined : bot_id || undefined,
                    workspace_id: task ? undefined : workspace_id || undefined,
                    title,
                    description,
                    status,
                    blocked_reason: status == "blocked" ? blocked_reason || null : null,
                },
            },
        );

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Couldn't save the task.");
            return;
        }

        onSaved(res.singleRes, res.msg || "Saved.");
    };

    return (
        <Form onSubmit={submit} className="gap-3!">
            <Stack className="gap-3! items-stretch">
                <Input
                    label="Title"
                    value={title}
                    changeHandler={setTitle}
                    placeholder="What needs doing?"
                    maxLength={AppData.TaskTitleMaxLength}
                    disabled={loading}
                />
                <Textarea
                    label="Brief"
                    value={description}
                    changeHandler={setDescription}
                    placeholder="What to do, where, and how you'll know it's done."
                    maxLength={AppData.TaskDescriptionMaxLength}
                    rows={5}
                    disabled={loading}
                />
                <Select
                    label="Status"
                    showLabel
                    options={TaskStatuses.map((it) => ({
                        title: it.title,
                        value: it.value,
                        default: it.value == status,
                    }))}
                    changeHandler={(value) => setStatus(String(value) as TaskStatus)}
                />
                {status == "blocked" ? (
                    <Textarea
                        label="Waiting on the user for"
                        value={blocked_reason}
                        changeHandler={setBlockedReason}
                        placeholder="What the user has to do before this can go on."
                        maxLength={AppData.TaskNoteMaxLength}
                        rows={2}
                        disabled={loading}
                    />
                ) : null}
                <AddFormActions
                    submit_label={task ? "Save" : "Add task"}
                    loading={loading}
                    error={error}
                    onCancel={onCancel}
                />
            </Stack>
        </Form>
    );
}
