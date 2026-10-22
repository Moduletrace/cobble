import Tag from "@moduletrace/twui/elements/Tag";
import { TaskStatuses, type TaskStatus } from "@/src/dict/task-dict";

type Props = {
    status?: TaskStatus | string | null;
};

/**
 * A task's status as one word. The tone follows the state: a blocked task
 * is the only one that asks for the user, so it's the only one that reads
 * as a call.
 */
export default function TaskStatusChip({ status = "todo" }: Props) {
    const value = (status || "todo") as TaskStatus;
    const title = TaskStatuses.find((it) => it.value == value)?.title || "To do";

    const tone =
        value == "blocked"
            ? "text-ink border-ink"
            : value == "doing"
              ? "text-ink border-hairline-strong"
              : "text-ink-secondary border-hairline";

    return (
        <Tag className={`shrink-0 px-2! py-0.5! text-[11px]! font-bold! leading-4! border border-solid ${tone}`}>
            {title}
        </Tag>
    );
}
