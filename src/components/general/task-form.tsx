import { useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Select from "@moduletrace/twui/form/Select";
import Textarea from "@moduletrace/twui/form/Textarea";
import Stack from "@moduletrace/twui/layout/Stack";
import CodeEditor from "@/src/components/general/code-editor";
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
     * Adding to a workspace without a `bot_id`: the bots there to pick who
     * has it, since every task belongs to a bot.
     */
    bots?: { id?: number | string | null; name?: string | null }[];
    /**
     * Edits this task; adds one when not given.
     */
    task?: TaskDetail | null;
    onSaved: (task: TaskDetail, msg: string) => void;
    onCancel: () => void;
};

/**
 * The one task form: a title, the brief (in the code editor), the status and, while it's
 * blocked, what the user has to do. The workspace's tasks group and the
 * conversation's tasks modal both add and edit with it.
 */
export default function TaskForm({
    bot_id,
    workspace_id,
    bots = [],
    task,
    onSaved,
    onCancel,
}: Props) {
    const [title, setTitle] = useState(task?.title || "");
    const [description, setDescription] = useState(task?.description || "");
    const [status, setStatus] = useState<TaskStatus>(
        (task?.status as TaskStatus) || "todo",
    );
    const [blocked_reason, setBlockedReason] = useState(
        task?.blocked_reason || "",
    );
    const pick_bot = !task && !bot_id && Boolean(workspace_id);
    const [picked_bot_id, setPickedBotId] = useState<number | undefined>(
        bots[0]?.id ? Number(bots[0].id) : undefined,
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const submit = async () => {
        if (loading) return;

        if (!title.trim()) {
            setError("A task needs a title.");
            return;
        }

        if (pick_bot && !picked_bot_id) {
            setError("Pick the bot that has it.");
            return;
        }

        setLoading(true);
        setError(undefined);

        const res = await fetchApi<
            Record<string, unknown>,
            APIResponseObject<TaskDetail>
        >("/api/admin/tasks/save-task", {
            method: "POST",
            body: {
                task_id: task?.id ? Number(task.id) : undefined,
                bot_id: task ? undefined : bot_id || picked_bot_id || undefined,
                workspace_id: task ? undefined : workspace_id || undefined,
                title,
                description,
                status,
                blocked_reason:
                    status == "blocked" ? blocked_reason || null : null,
            },
        });

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Couldn't save the task.");
            return;
        }

        onSaved(res.singleRes, res.msg || "Saved.");
    };

    return (
        <Form onSubmit={submit} className="gap-3!">
            <Stack className="gap-6! items-stretch">
                <Input
                    title="Title"
                    label="Title"
                    showLabel
                    value={title}
                    changeHandler={setTitle}
                    placeholder="What needs doing?"
                    maxLength={AppData.TaskTitleMaxLength}
                    disabled={loading}
                />
                {pick_bot ? (
                    <Select
                        title="Who has it"
                        label="Who has it"
                        showLabel
                        options={bots.map((bot) => ({
                            title: bot.name || `Bot ${bot.id}`,
                            value: String(bot.id),
                            default: Number(bot.id) == picked_bot_id,
                        }))}
                        changeHandler={(value) => setPickedBotId(Number(value) || undefined)}
                    />
                ) : null}
                <CodeEditor
                    mode="markdown"
                    className="h-[500px]"
                    title="Brief"
                    placeholder="What to do, where, and how you'll know it's done."
                    content={description}
                    info={`Up to ${AppData.TaskDescriptionMaxLength.toLocaleString()} characters.`}
                    onChange={setDescription}
                />
                <Select
                    title="Status"
                    label="Status"
                    showLabel
                    options={TaskStatuses.map((it) => ({
                        title: it.title,
                        value: it.value,
                        default: it.value == status,
                    }))}
                    changeHandler={(value) =>
                        setStatus(String(value) as TaskStatus)
                    }
                />
                {status == "blocked" ? (
                    <Textarea
                        title="Waiting on the user for"
                        label="Waiting on the user for"
                        showLabel
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
