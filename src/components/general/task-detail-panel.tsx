import { useRef, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import Textarea from "@moduletrace/twui/form/Textarea";
import { OpenTaskStatuses } from "@/src/dict/task-dict";
import type { TaskDetail, TaskFile } from "@/src/types";
import TaskFileRow from "@/src/components/general/task-file-row";
import HandOverForm from "@/src/components/general/hand-over-form";
import TaskForm from "@/src/components/general/task-form";
import TaskStatusChip from "@/src/components/general/task-status-chip";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";

type Props = {
    task: TaskDetail;
    /**
     * A crew manager can change it, file onto it and delete it.
     */
    can_manage?: boolean;
    onChanged: (task: TaskDetail, msg?: string) => void;
    onDeleted: () => void;
};

/**
 * One task opened: what it is, its notes oldest first, its files (each
 * opening its bytes), a box to add a note, and edit or delete. A crew
 * manager can file a new deliverable straight onto it, or hand an open
 * one to another bot, which starts on it.
 */
export default function TaskDetailPanel({ task, can_manage, onChanged, onDeleted }: Props) {
    const [editing, setEditing] = useState(false);
    const [handing_over, setHandingOver] = useState(false);
    const [note, setNote] = useState("");
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState<string>();
    const file_input = useRef<HTMLInputElement>(null);

    const run = async (params: { path: string; body: Record<string, unknown>; done: string }) => {
        if (busy) return;

        setBusy(true);
        setStatus(undefined);

        const res = await fetchApi<Record<string, unknown>, APIResponseObject<TaskDetail>>(
            `/api/admin/${params.path}`,
            { method: "POST", body: params.body },
        );

        setBusy(false);

        if (!res.success || !res.singleRes) {
            setStatus(res.msg || "That didn't work.");
            return;
        }

        setStatus(params.done);
        onChanged(res.singleRes, params.done);
    };

    const addNote = async () => {
        if (!note.trim()) return;

        await run({ path: "tasks/add-note", body: { task_id: Number(task.id), text: note }, done: "Note added." });
        setNote("");
    };

    const attach = async (file: File) => {
        if (busy) return;

        const data_url = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ""));
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        }).catch(() => "");

        if (!data_url) {
            setStatus(`${file.name} couldn't be read.`);
            return;
        }

        await run({
            path: "tasks/attach-file",
            body: { task_id: Number(task.id), data_url, name: file.name, kind: "deliverable" },
            done: `${file.name} added as a deliverable.`,
        });
    };

    const detach = async ({ file }: { file: TaskFile }) => {
        if (!window.confirm(`Unlink ${file.name || "this file"} from the task?`)) return;

        await run({
            path: "tasks/detach-file",
            body: { task_id: Number(task.id), task_media_id: Number(file.id) },
            done: "File unlinked.",
        });
    };

    if (editing) {
        return (
            <TaskForm
                task={task}
                onCancel={() => setEditing(false)}
                onSaved={(saved, msg) => {
                    setEditing(false);
                    onChanged(saved, msg);
                }}
            />
        );
    }

    if (handing_over) {
        return (
            <HandOverForm<TaskDetail>
                what={`"${task.title}"`}
                targets_path="tasks/hand-over-targets"
                submit_path="tasks/hand-over-task"
                body={{ task_id: Number(task.id) }}
                with_note
                onCancel={() => setHandingOver(false)}
                onHandedOver={({ saved, msg }) => {
                    setHandingOver(false);
                    onChanged(saved, msg);
                }}
            />
        );
    }

    const deliverables = task.files.filter((file) => file.kind != "reference");
    const references = task.files.filter((file) => file.kind == "reference");

    return (
        <Stack className="w-full gap-4! items-stretch">
            <Row className="w-full gap-2! flex-nowrap items-center">
                <TaskStatusChip status={task.status} />
                <Span className="grow min-w-0 text-[13px] leading-[18px] text-ink-secondary truncate">
                    {task.workspace_id
                        ? task.workspace_name || `Workspace ${task.workspace_id}`
                        : task.bot_name || `Bot ${task.bot_id}`}
                </Span>
                {can_manage ? (
                    <Row className="shrink-0 gap-1! flex-nowrap">
                        {(OpenTaskStatuses as readonly string[]).includes(task.status || "") ? (
                            <Button
                                title="Hand the task to another bot"
                                type="button"
                                variant="ghost"
                                color="gray"
                                size="small"
                                disabled={busy}
                                onClick={() => setHandingOver(true)}
                                className="px-2! text-[12px]"
                            >
                                Hand over
                            </Button>
                        ) : null}
                        <Button
                            title="Edit the task"
                            type="button"
                            variant="ghost"
                            color="gray"
                            size="small"
                            disabled={busy}
                            onClick={() => setEditing(true)}
                            className="px-2! text-[12px]"
                        >
                            Edit
                        </Button>
                        <Button
                            title="Delete the task"
                            type="button"
                            variant="ghost"
                            color="gray"
                            size="small"
                            disabled={busy}
                            onClick={async () => {
                                if (!window.confirm(`Delete "${task.title}"? Its notes and links go with it.`)) return;

                                setBusy(true);
                                const res = await fetchApi<Record<string, unknown>, APIResponseObject>(
                                    "/api/admin/tasks/delete-task",
                                    { method: "POST", body: { task_id: Number(task.id) } },
                                );
                                setBusy(false);

                                if (!res.success) {
                                    setStatus(res.msg || "That didn't work.");
                                    return;
                                }

                                onDeleted();
                            }}
                            className="px-2! text-[12px]"
                        >
                            Delete
                        </Button>
                    </Row>
                ) : null}
            </Row>

            {task.status == "blocked" && task.blocked_reason ? (
                <Span className="text-[13px] leading-[18px] text-ink">{`Waiting on you: ${task.blocked_reason}`}</Span>
            ) : null}

            {task.description ? (
                <Span className="whitespace-pre-wrap text-[13px] leading-[19px] text-ink">{task.description}</Span>
            ) : null}

            <Stack className="w-full gap-1! items-stretch">
                <Span className="text-[12px] font-bold leading-4 text-ink-secondary">Files</Span>
                {deliverables.length || references.length ? (
                    <Stack className="w-full gap-0! items-stretch">
                        {[...deliverables, ...references].map((file) => (
                            <TaskFileRow
                                key={file.id}
                                file={file}
                                busy={busy}
                                onDetach={can_manage ? () => detach({ file }) : undefined}
                            />
                        ))}
                    </Stack>
                ) : (
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">Nothing filed yet.</Span>
                )}
                {can_manage ? (
                    <Row className="gap-2! flex-nowrap items-center">
                        <input
                            ref={file_input}
                            type="file"
                            className="hidden"
                            onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) attach(file).catch(() => {});
                                event.target.value = "";
                            }}
                        />
                        <Button
                            title="Add a file as a deliverable"
                            type="button"
                            variant="ghost"
                            color="gray"
                            size="small"
                            disabled={busy}
                            onClick={() => file_input.current?.click()}
                            className="px-2! text-[12px]"
                        >
                            Add a file
                        </Button>
                    </Row>
                ) : null}
            </Stack>

            <Stack className="w-full gap-1! items-stretch">
                <Span className="text-[12px] font-bold leading-4 text-ink-secondary">Notes</Span>
                {task.notes.length ? (
                    task.notes.map((entry) => (
                        <Row key={entry.id} className="w-full gap-2! flex-nowrap items-start">
                            <Span className="shrink-0 text-[11px] leading-[18px] text-ink-secondary">
                                {entry.author == "user" ? "You" : "Bot"}
                            </Span>
                            <Span className="grow min-w-0 whitespace-pre-wrap text-[13px] leading-[18px] text-ink">
                                {entry.text}
                            </Span>
                        </Row>
                    ))
                ) : (
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">No notes yet.</Span>
                )}
                <Textarea
                    placeholder="Add a note"
                    value={note}
                    changeHandler={setNote}
                    rows={2}
                    disabled={busy}
                />
                <Row className="justify-end">
                    <Button
                        title="Add the note"
                        type="button"
                        variant="outlined"
                        color="gray"
                        size="small"
                        loading={busy}
                        disabled={busy || !note.trim()}
                        onClick={() => addNote().catch(() => {})}
                    >
                        Add note
                    </Button>
                </Row>
            </Stack>

            {status ? (
                <Span role="status" className="text-[13px] leading-[18px] text-ink-secondary">
                    {status}
                </Span>
            ) : null}
        </Stack>
    );
}
