import type { MessageTask } from "@/src/types";
import TaskRefChip from "./task-ref-chip";

type Props = MessageTask;

/**
 * One tracker task linked under a bot message: its chip with title and
 * status, opening the task.
 */
export default function MessageTaskChip({ id, title, status }: Props) {
    return <TaskRefChip task_id={id} title={title} status={status} />;
}
