import type { TaskWithNames } from "@/src/types";

/**
 * Blocked, then doing, then to do, then finished, each newest first: the
 * order a task list reads in.
 */
export default function compareTasks(a: TaskWithNames, b: TaskWithNames) {
    const rank = (task: TaskWithNames) =>
        task.status == "blocked" ? 0 : task.status == "doing" ? 1 : task.status == "todo" ? 2 : 3;
    const diff = rank(a) - rank(b);

    return diff != 0 ? diff : Number(b.updated_at || b.id || 0) - Number(a.updated_at || a.id || 0);
}