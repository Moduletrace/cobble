import { useContext } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import Button from "@moduletrace/twui/layout/Button";
import type { TaskWithNames } from "@/src/types";
import { AppContext } from "@/src/pages/__root";
import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotFace, BotHue } from "@/src/dict/bot-dict";
import { TaskStatuses } from "@/src/dict/task-dict";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import relativeTime from "@/src/utils/relative-time";
import TaskStatusChip from "./task-status-chip";

type Props = {
    task: TaskWithNames;
    /**
     * Opens the task to read its notes and files, and to edit it.
     */
    onOpen?: () => void;
    /**
     * Moves it to one status; only crew managers get the controls.
     */
    onStatusChange?: (status: string) => void;
    busy?: boolean;
};

/**
 * One task: whose it is (a bot's stone), its title and status, the
 * workspace, what it's blocked on, its latest note and how long ago it
 * moved.
 */
export default function TaskListItem({ task, onOpen, onStatusChange, busy }: Props) {
    const { pageProps } = useContext(AppContext);
    const can_manage = canManageCrew({ user_types: pageProps?.user_types });
    const done = task.status == "done" || task.status == "cancelled";
    const moves = TaskStatuses.filter((it) => ["todo", "doing", "done"].includes(it.value));

    return (
        <Row className="w-full gap-3! flex-nowrap items-start px-3 py-3 border-0 border-b border-solid border-hairline last:border-b-0">
            <BotAvatar
                image_media_id={task.bot_image_media_id}
                hue={(task.bot_kind == "coordinator" ? null : task.bot_hue || null) as BotHue | null}
                face={(task.bot_face || "idle") as BotFace}
                size={28}
            />
            <Stack className="grow min-w-0 gap-0.5! items-stretch">
                <Row className="w-full gap-2! flex-nowrap items-center">
                    <Button
                        title={task.title || "Open the task"}
                        type="button"
                        variant="ghost"
                        color="text"
                        onClick={onOpen}
                        className={`grow min-w-0 justify-start px-0! h-auto! py-0! text-sm! font-bold! leading-5! truncate text-left hover:bg-transparent! hover:underline ${
                            done ? "text-ink-secondary! line-through" : "text-ink!"
                        }`}
                    >
                        <Span className="truncate">{task.title || `Task ${task.id}`}</Span>
                    </Button>
                    <TaskStatusChip status={task.status} />
                </Row>
                <Row className="w-full gap-2! flex-nowrap items-center">
                    <Span className="shrink-0 text-xs leading-4 text-ink-secondary truncate">
                        {task.workspace_id
                            ? task.workspace_name || `Workspace ${task.workspace_id}`
                            : task.bot_name || `Bot ${task.bot_id}`}
                    </Span>
                    {task.status == "blocked" && task.blocked_reason ? (
                        <Span className="min-w-0 text-xs leading-4 text-ink truncate">
                            {`Waiting on you: ${task.blocked_reason}`}
                        </Span>
                    ) : null}
                    {task.updated_at ? (
                        <Span className="ml-auto shrink-0 text-[11px] leading-4 text-ink-secondary">
                            {relativeTime({ at: Number(task.updated_at) })}
                        </Span>
                    ) : null}
                </Row>
                {task.latest_note ? (
                    <Span className="text-xs leading-4 text-ink-secondary line-clamp-2">{task.latest_note}</Span>
                ) : null}
                {can_manage && onStatusChange ? (
                    <Row className="gap-1! flex-nowrap items-center pt-0.5">
                        {moves
                            .filter((it) => it.value != task.status)
                            .map((it) => (
                                <Button
                                    key={it.value}
                                    title={`Mark it ${it.title.toLowerCase()}`}
                                    type="button"
                                    variant="ghost"
                                    color="gray"
                                    size="small"
                                    disabled={busy}
                                    onClick={() => onStatusChange(it.value)}
                                    className="px-1.5! text-[12px]"
                                >
                                    {it.title}
                                </Button>
                            ))}
                    </Row>
                ) : null}
            </Stack>
        </Row>
    );
}
