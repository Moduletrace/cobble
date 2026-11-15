import Stack from "@moduletrace/twui/layout/Stack";
import type { TaskWithNames } from "@/src/types";
import workspaceTaskSections from "@/src/utils/task-sections/workspace-task-sections";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import WorkspaceTaskSection from "@/src/pages/admin/workspaces/[workspace_id]/(partials)/workspace-task-section";

type Props = {
    open: boolean;
    setOpen: (open: boolean) => void;
    /**
     * Every task in the workspace, not only the ones the page lists.
     */
    tasks: TaskWithNames[];
    onOpenTask: (task: TaskWithNames) => void;
};

/**
 * Every task in a workspace, sectioned the way the page's own list is but
 * without its cap: the workspace-wide ones first, then one section per bot.
 * A row opens the task's own modal over this one, which stays behind it.
 */
export default function WorkspaceTasksModal({ open, setOpen, tasks, onOpenTask }: Props) {
    const sections = workspaceTaskSections({ tasks });

    return (
        <AddModalShell
            open={open}
            setOpen={setOpen}
            title="All tasks"
            description="Everything in this workspace: the workspace-wide tasks first (every bot here works on those), then each bot's own list. Open tasks come before finished ones."
        >
            <Stack className="max-h-[60vh] w-full gap-4! items-stretch overflow-y-auto">
                {sections.map((section) => (
                    <WorkspaceTaskSection key={section.key} section={section} onOpenTask={onOpenTask} />
                ))}
            </Stack>
        </AddModalShell>
    );
}