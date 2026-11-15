import type { TaskWithNames } from "@/src/types";
import compareTasks from "./compare-tasks";

export type WorkspaceTaskSection = {
    /**
     * `wide`, or `bot:<id>`: stable across renders and renames.
     */
    key: string;
    title: string;
    tasks: TaskWithNames[];
};

/**
 * A workspace's tasks as the page lists them: the workspace-wide ones first
 * (nobody's: every bot there works on them), then each bot's own, one
 * section per bot in the order of their names, the tasks in each in the
 * usual open-first order. Empty sections are left out.
 */
export default function workspaceTaskSections({ tasks }: { tasks: TaskWithNames[] }): WorkspaceTaskSection[] {
    const wide = tasks.filter((task) => !task.bot_id).sort(compareTasks);

    const by_bot = new Map<number, WorkspaceTaskSection>();

    for (const task of tasks) {
        if (!task.bot_id) continue;

        const bot_id = Number(task.bot_id);
        const section = by_bot.get(bot_id) || {
            key: `bot:${bot_id}`,
            title: task.bot_name || `Bot ${bot_id}`,
            tasks: [],
        };

        section.tasks.push(task);
        by_bot.set(bot_id, section);
    }

    const sections = [...by_bot.values()]
        .map((section) => ({ ...section, tasks: section.tasks.sort(compareTasks) }))
        .sort((a, b) => a.title.localeCompare(b.title));

    return wide.length ? [{ key: "wide", title: "Workspace-wide", tasks: wide }, ...sections] : sections;
}