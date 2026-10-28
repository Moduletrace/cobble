import { twMerge } from "tailwind-merge";
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

    /**
     * A `Tag` is a filled primary button by default (ink in light mode), so
     * the chip clears its fill and sets its own text: only the outline speaks.
     */
    return (
        <Tag
            className={twMerge(
                "shrink-0 px-2! py-0.5! text-[11px]! font-bold! leading-4! border border-solid",
                "bg-transparent! dark:bg-transparent! hover:bg-transparent!",
                value == "blocked" && "text-ink! dark:text-ink! border-ink",
                value == "doing" && "text-ink! dark:text-ink! border-hairline-strong",
                value != "blocked" && value != "doing" && "text-ink-secondary! dark:text-ink-secondary! border-hairline",
            )}
        >
            {title}
        </Tag>
    );
}
