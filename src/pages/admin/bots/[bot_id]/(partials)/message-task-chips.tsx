import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import type { MessageTask } from "@/src/types";
import MessageTaskChip from "./message-task-chip";

type Props = {
    tasks?: MessageTask[];
};

/**
 * The tracker tasks a bot message is about, under it: every task the run
 * behind it read in full, added, moved along or handed over (and the one a
 * handed-over run was for), recorded by the app rather than written by the
 * bot, so a message always says which tasks it concerns. Each opens the
 * task.
 */
export default function MessageTaskChips({ tasks }: Props) {
    if (!tasks?.length) return null;

    return (
        <Row className="gap-1.5! items-center flex-wrap max-w-full">
            <Span className="text-[11px] leading-4 text-ink-secondary whitespace-nowrap">
                {tasks.length == 1 ? "Task" : "Tasks"}
            </Span>
            {/* Keyed by what it shows, so a reload with a new title or status redraws it. */}
            {tasks.map((task) => (
                <MessageTaskChip key={`${task.id}:${task.status}:${task.title}`} {...task} />
            ))}
        </Row>
    );
}
