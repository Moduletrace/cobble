import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import TaskListItem from "@/src/components/general/task-list-item";
import type { TaskWithNames } from "@/src/types";
import type { WorkspaceTaskSection as Section } from "@/src/utils/task-sections/workspace-task-sections";

type Props = {
    section: Section;
    onOpenTask: (task: TaskWithNames) => void;
};

/**
 * One heading and its tasks in the all-tasks modal: the workspace-wide ones
 * under "Workspace-wide", then one section per bot (`workspaceTaskSections`
 * decides which and in what order). The heading says how many are open, so a
 * bot's list reads at a glance.
 */
export default function WorkspaceTaskSection({ section, onOpenTask }: Props) {
    const open = section.tasks.filter((task) => task.status != "done" && task.status != "cancelled").length;

    return (
        <Stack className="w-full gap-1! items-stretch">
            <Row className="w-full items-baseline justify-between gap-2!">
                <Span className="text-[12px] font-bold leading-4 text-ink">{section.title}</Span>
                <Span className="shrink-0 text-[12px] leading-4 text-ink-secondary">
                    {`${section.tasks.length} task${section.tasks.length == 1 ? "" : "s"}${open ? `, ${open} open` : ""}`}
                </Span>
            </Row>
            <Stack className="w-full gap-0! items-stretch">
                {section.tasks.map((task) => (
                    <TaskListItem key={task.id} task={task} onOpen={() => onOpenTask(task)} />
                ))}
            </Stack>
        </Stack>
    );
}