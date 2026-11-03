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

/**
 * The picker's value for a workspace-wide task, which no bot has.
 */
const WorkspaceWideValue = "workspace";

type Props = {
    /**
     * The list it's added to: a bot's own, or a workspace's.
     */
    bot_id?: number | null;
    workspace_id?: number | null;
    /**
     * Adding to a workspace: the bots there to pick who has it (`bot_id`,
     * when given, first), plus the workspace-wide choice every bot there
     * works on. A task goes to a bot unless that's picked.
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
    const pick_bot = !task && Boolean(workspace_id);
    const default_bot_id = bot_id || (bots[0]?.id ? Number(bots[0].id) : undefined);
    const [picked, setPicked] = useState<string>(
        default_bot_id ? String(default_bot_id) : WorkspaceWideValue,
    );
    const workspace_wide = pick_bot && picked == WorkspaceWideValue;
    const picked_bot_id = pick_bot && !workspace_wide ? Number(picked) || undefined : bot_id || undefined;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const submit = async () => {
        if (loading) return;

        if (!title.trim()) {
            setError("A task needs a title.");
            return;
        }

        if (pick_bot && !workspace_wide && !picked_bot_id) {
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
                bot_id: task || workspace_wide ? undefined : picked_bot_id,
                workspace_id: task ? undefined : workspace_id || undefined,
                workspace_wide: task ? undefined : workspace_wide || undefined,
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
                        options={[
                            ...bots.map((bot) => ({
                                title: bot.name || `Bot ${bot.id}`,
                                value: String(bot.id),
                                default: String(bot.id) == picked,
                            })),
                            {
                                title: "Every bot here (workspace-wide)",
                                value: WorkspaceWideValue,
                                default: workspace_wide,
                            },
                        ]}
                        changeHandler={(value) => setPicked(String(value))}
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
