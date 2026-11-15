import { AppData } from "@/src/data/app-data";
import type { TaskWithNames } from "@/src/types";
import workspaceTaskSections from "./workspace-task-sections";

type Params = {
    tasks: TaskWithNames[];
    /**
     * How many to keep; `AppData.TaskSectionShown` unless a caller says.
     */
    shown?: number;
};

/**
 * The rows a workspace page lists before its View all button: the
 * workspace-wide tasks first, then each bot's own, open ones first, cut to
 * the cap.
 */
export default function shownWorkspaceTasks({ tasks, shown = AppData.TaskSectionShown }: Params): TaskWithNames[] {
    return workspaceTaskSections({ tasks })
        .flatMap((section) => section.tasks)
        .slice(0, shown);
}