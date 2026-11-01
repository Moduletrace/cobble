import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import type { BotHookWithNames } from "@/src/types";
import relativeTime from "@/src/utils/relative-time";
import HookCallText from "./hook-call-text";
import HookCalls from "./hook-calls";
import TaskFactRow from "./task-fact-row";

type Props = {
    /**
     * The hook clicked; open while set.
     */
    hook?: BotHookWithNames | null;
    onClose: () => void;
    onEdit: (params: { hook: BotHookWithNames }) => void;
};

/**
 * A hook opened from a list in a modal of its own: what it is, and its
 * thread, every call with what its run answered. Results only ever show
 * here, never in a chat.
 */
export default function HookDetailModal({ hook, onClose, onEdit }: Props) {
    const runs = Number(hook?.run_count || 0);
    const watching = hook?.source == "browser_notifications";

    return (
        <AddModalShell
            open={Boolean(hook)}
            setOpen={(open) => !open && onClose()}
            title={hook?.title || `Hook ${hook?.id || ""}`}
            description="What calls this hook, and what each call did."
        >
            {hook ? (
                <Stack className="mt-4 max-h-[70vh] w-full gap-4! items-stretch overflow-y-auto">
                    <Stack className="w-full gap-1! items-stretch">
                        <TaskFactRow label="Bot">{hook.bot_name || "A removed bot"}</TaskFactRow>
                        <TaskFactRow label="Runs in">{hook.workspace_name || "Its own chat"}</TaskFactRow>
                        <TaskFactRow label="Called by">
                            {watching
                                ? `Notifications on ${hook.watch_computer_name || "a computer"}${hook.watch_filter ? ` with "${hook.watch_filter}"` : ""}`
                                : hook.has_signing_secret
                                  ? "Its URL, signed calls only"
                                  : "Its URL"}
                        </TaskFactRow>
                        <TaskFactRow label="State">{hook.enabled ? "On" : "Paused"}</TaskFactRow>
                        <TaskFactRow label="Runs">{runs}</TaskFactRow>
                        <TaskFactRow label="Last called">
                            {hook.last_called_at ? relativeTime({ at: Number(hook.last_called_at) }) : "Never"}
                        </TaskFactRow>
                        {hook.last_error ? <TaskFactRow label="Last error">{hook.last_error}</TaskFactRow> : null}
                    </Stack>
                    {hook.instructions ? <HookCallText label="Brief" text={hook.instructions} full /> : null}
                    <Row className="w-full gap-2! justify-end">
                        <Button
                            title={`Edit ${hook.title || "the hook"}`}
                            type="button"
                            variant="ghost"
                            color="gray"
                            size="small"
                            onClick={() => onEdit({ hook })}
                            className="px-2! text-[12px]"
                        >
                            Edit
                        </Button>
                    </Row>
                    <Stack className="w-full gap-2! items-stretch">
                        <Span className="text-sm font-bold leading-5 text-ink">Activity</Span>
                        <HookCalls
                            key={hook.id}
                            hook_id={Number(hook.id)}
                            bot_id={Number(hook.bot_id)}
                            workspace_id={Number(hook.workspace_id) || null}
                        />
                    </Stack>
                </Stack>
            ) : null}
        </AddModalShell>
    );
}
