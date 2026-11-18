import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Link from "@moduletrace/twui/layout/Link";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import SettingsStatus from "@/src/pages/admin/settings/(partials)/settings-status";
import type { BotHookWithNames } from "@/src/types";
import conversationHref from "@/src/utils/conversation-href";
import hookRunnerState from "@/src/utils/hook-runner-state";
import relativeTime from "@/src/utils/relative-time";
import HookCallText from "./hook-call-text";
import HookCalls from "./hook-calls";
import TaskFactRow from "./task-fact-row";

type Props = {
    /**
     * The hook clicked; open while set.
     */
    hook?: BotHookWithNames | null;
    /**
     * Crew managers can restart its runner from here.
     */
    can_manage?: boolean;
    onClose: () => void;
    onEdit: (params: { hook: BotHookWithNames }) => void;
    /**
     * The hook as it reads after a restart, for the list behind.
     */
    onRestarted?: (params: { hook: BotHookWithNames }) => void;
};

/**
 * A hook opened from a list in a modal of its own: what it is, the process
 * kept running for it (and restarting it), then its every call with what
 * its run answered, and the way to its thread (the session its runs leave
 * their messages in, chatted in like any other).
 */
export default function HookDetailModal({ hook, can_manage = false, onClose, onEdit, onRestarted }: Props) {
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState<{ error?: boolean; msg: string }>();
    const runs = Number(hook?.run_count || 0);
    const watching = hook?.source == "browser_notifications";
    const runner = hook ? hookRunnerState({ hook }) : null;
    const thread_url = hook?.latest_session_id
        ? conversationHref({
              bot_id: hook.bot_id!,
              workspace_id: hook.workspace_id,
              session_id: hook.latest_session_id,
          })
        : null;

    const restart = async () => {
        if (!hook || busy) return;

        setBusy(true);
        setStatus(undefined);

        const res = await postAdminApi<BotHookWithNames>({
            path: "hooks/restart-runner",
            body: { hook_id: hook.id },
        });

        setBusy(false);

        if (!res.success || !res.singleRes) {
            setStatus({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        setStatus({ msg: res.msg || "Restarted." });
        onRestarted?.({ hook: res.singleRes });
    };

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
                        <TaskFactRow label="State">
                            {hook.enabled ? (hook.silent ? "On, silent" : "On") : "Paused"}
                        </TaskFactRow>
                        {runner?.configured ? (
                            <>
                                <TaskFactRow label="Runner">
                                    {runner.running
                                        ? `Up since ${relativeTime({ at: Number(hook.runner_started_at) || Date.now() })}`
                                        : hook.runner_last_error || "Down"}
                                </TaskFactRow>
                                {hook.runner_command ? (
                                    <TaskFactRow label="Runner command">
                                        <Span className="font-mono text-[12px] leading-4 text-ink">{hook.runner_command}</Span>
                                    </TaskFactRow>
                                ) : null}
                                {hook.runner_dir ? <TaskFactRow label="Runner folder">{hook.runner_dir}</TaskFactRow> : null}
                            </>
                        ) : null}
                        <TaskFactRow label="Thread">
                            {thread_url ? (
                                <Link
                                    href={thread_url}
                                    title="Open the session its latest call left its messages in"
                                    className="text-ink underline underline-offset-2"
                                >
                                    Its latest session
                                </Link>
                            ) : (
                                "No run yet"
                            )}
                        </TaskFactRow>
                        <TaskFactRow label="Runs">{runs}</TaskFactRow>
                        <TaskFactRow label="Last called">
                            {hook.last_called_at ? relativeTime({ at: Number(hook.last_called_at) }) : "Never"}
                        </TaskFactRow>
                        {hook.last_error ? <TaskFactRow label="Last error">{hook.last_error}</TaskFactRow> : null}
                    </Stack>
                    {hook.instructions ? <HookCallText label="Brief" text={hook.instructions} full /> : null}
                    {status ? <SettingsStatus status={status} /> : null}
                    <Row className="w-full gap-2! justify-end">
                        {can_manage && runner?.configured ? (
                            <Button
                                title="Stop it and start it again"
                                type="button"
                                variant="ghost"
                                color="gray"
                                size="small"
                                loading={busy}
                                onClick={restart}
                                className="px-2! text-[12px]"
                            >
                                Restart runner
                            </Button>
                        ) : null}
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
