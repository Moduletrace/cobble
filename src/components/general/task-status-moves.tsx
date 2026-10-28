import Row from "@moduletrace/twui/layout/Row";
import { twMerge } from "tailwind-merge";
import { TaskStatuses } from "@/src/dict/task-dict";
import TaskStatusMoveButton from "./task-status-move-button";

type Props = {
    /**
     * The task's status now; its own button is left out.
     */
    status?: string | null;
    disabled?: boolean;
    onMove: (status: string) => void;
    className?: string;
};

const MoveStatuses = TaskStatuses.filter((it) => ["todo", "doing", "done"].includes(it.value));

/**
 * The buttons that move a task along (To do, Doing, Done), the one it's
 * at left out. Shown to crew managers on a list row and in the task modal.
 */
export default function TaskStatusMoves({ status, disabled, onMove, className }: Props) {
    return (
        <Row className={twMerge("gap-1! flex-nowrap items-center", className)}>
            {MoveStatuses.filter((it) => it.value != status).map((it) => (
                <TaskStatusMoveButton
                    key={it.value}
                    title={it.title}
                    value={it.value}
                    disabled={disabled}
                    onMove={onMove}
                />
            ))}
        </Row>
    );
}
