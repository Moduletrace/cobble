import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Button from "@moduletrace/twui/layout/Button";
import { twMerge } from "tailwind-merge";
import type { TaskWithNames } from "@/src/types";
import TaskStatusChip from "./task-status-chip";

type Props = {
    /**
     * One part of a workspace-wide task.
     */
    subtask: TaskWithNames;
    /**
     * Opens it in the task modal.
     */
    onOpen: () => void;
};

/**
 * One part under its workspace-wide task: its status, its title and the bot
 * that has it (or nobody yet). Clicking it opens the part.
 */
export default function TaskSubtaskRow({ subtask, onOpen }: Props) {
    const done = subtask.status == "done" || subtask.status == "cancelled";

    return (
        <Row className="w-full gap-2! flex-nowrap items-center py-1">
            <TaskStatusChip status={subtask.status} />
            <Button
                title={`Open ${subtask.title || `task ${subtask.id}`}`}
                type="button"
                variant="ghost"
                color="text"
                onClick={onOpen}
                className={twMerge(
                    "grow min-w-0 justify-start px-0! h-auto! py-0! text-[13px]! font-normal! leading-[18px]! truncate text-left hover:bg-transparent! hover:underline",
                    "[&_.twui-button-content-wrapper]:min-w-0 [&_.twui-button-content-wrapper]:gap-1.5",
                    done ? "text-ink-secondary! line-through" : "text-ink!",
                )}
            >
                <Span className="truncate">{subtask.title || `Task ${subtask.id}`}</Span>
                <Span
                    title={`Task ${subtask.id}`}
                    className="shrink-0 text-[11px] leading-4 font-normal text-ink-secondary tabular-nums"
                >
                    {`#${subtask.id}`}
                </Span>
            </Button>
            <Span className="shrink-0 text-[11px] leading-4 text-ink-secondary">
                {subtask.bot_name || (subtask.bot_id ? `Bot ${subtask.bot_id}` : "Nobody")}
            </Span>
        </Row>
    );
}