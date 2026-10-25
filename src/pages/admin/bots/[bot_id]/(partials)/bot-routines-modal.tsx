import { useEffect, useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import H2 from "@moduletrace/twui/layout/H2";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import Button from "@moduletrace/twui/layout/Button";
import { Clock } from "lucide-react";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import type { BotWithLastMessage, CronJobWithNames } from "@/src/types";
import HandOverForm from "@/src/components/general/hand-over-form";
import RoutineForm from "@/src/components/general/routine-form";
import RoutineRow from "@/src/components/general/routine-row";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import SettingsList from "@/src/pages/admin/settings/(partials)/settings-list";
import SettingsStatus from "@/src/pages/admin/settings/(partials)/settings-status";
import { dropRoutine, replaceRoutine } from "@/src/utils/routine-list-changes";
import useBotRoutines from "../(hooks)/use-bot-routines";
import HeaderMenuItem from "./header-menu-item";

type Status = { error?: boolean; success?: boolean; msg?: string };

type Props = {
    bot: BotWithLastMessage;
    workspace?: BUN_SQLITE_COBBLE_WORKSPACES | null;
    /**
     * A row in the conversation header's menu instead of an icon beside it.
     */
    menu?: boolean;
    on_open?: () => void;
};

/**
 * The routines that run in this conversation: the schedules whose result
 * lands here, a bot's own on its chat or the ones it runs in this
 * workspace. Open it from the header menu; the list loads then, so the
 * page's props stay small. The user pauses, resumes, edits, hands over
 * and deletes their own; the bot makes them when asked in chat.
 */
export default function BotRoutinesModal({ bot, workspace, menu, on_open }: Props) {
    const [open, set_open] = useState(false);
    const [editing, set_editing] = useState<CronJobWithNames>();
    const [handing, set_handing] = useState<CronJobWithNames>();
    const [busy, set_busy] = useState(false);
    const [status, set_status] = useState<Status>();
    const { routines, setRoutines, loading, error } = useBotRoutines({
        bot_id: Number(bot.id),
        workspace_id: workspace?.id ? Number(workspace.id) : null,
        enabled: open,
    });

    const name = bot.name || "This bot";
    const place = workspace?.name || "this workspace";
    const title = workspace?.id ? `${place} routines` : `${name}'s routines`;

    useEffect(() => {
        if (open) on_open?.();
    }, [open]);

    const replace = ({ cron_job }: { cron_job: CronJobWithNames }) =>
        setRoutines((prev) => replaceRoutine({ routines: prev, cron_job }));

    const toggle = async ({ cron_job }: { cron_job: CronJobWithNames }) => {
        if (busy) return;

        set_busy(true);
        set_status(undefined);

        const res = await postAdminApi<CronJobWithNames>({
            path: "routines/update-routine",
            body: { cron_job_id: cron_job.id, enabled: !cron_job.enabled },
        });

        set_busy(false);

        if (!res.success || !res.singleRes) {
            set_status({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        replace({ cron_job: res.singleRes });
        set_status({ success: true, msg: cron_job.enabled ? "Paused." : "Resumed." });
    };

    const remove = async ({ cron_job }: { cron_job: CronJobWithNames }) => {
        if (busy) return;
        if (!window.confirm(`Delete the routine "${cron_job.title}"? A run already started carries on.`)) return;

        set_busy(true);
        set_status(undefined);

        const res = await postAdminApi({ path: "routines/delete-routine", body: { cron_job_id: cron_job.id } });

        set_busy(false);

        if (!res.success) {
            set_status({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        setRoutines((prev) => dropRoutine({ routines: prev, cron_job_id: cron_job.id }));
        set_status({ success: true, msg: "Deleted." });
    };

    return (
        <Modal
            target={
                menu ? (
                    <HeaderMenuItem icon={Clock} title="Schedules" description={title} loading={loading} />
                ) : (
                    <Button
                        title={title}
                        type="button"
                        variant="ghost"
                        color="text"
                        className="shrink-0 p-2! text-ink-secondary hover:text-ink hover:bg-sunken rounded-default"
                    >
                        <Clock size={18} aria-hidden />
                    </Button>
                )
            }
            targetWrapperProps={{ className: menu ? "w-full" : "shrink-0" }}
            open={open}
            setOpen={(next) => {
                set_open(next);

                if (!next) {
                    set_editing(undefined);
                    set_handing(undefined);
                    set_status(undefined);
                }
            }}
            className="max-w-xl bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch">
                <Row className="w-full gap-2! flex-nowrap items-center">
                    <H2 className="grow text-lg! leading-6! tracking-normal! font-bold text-ink">
                        {editing ? editing.title || "Routine" : handing ? `Hand over ${handing.title || "the routine"}` : title}
                    </H2>
                    {editing || handing ? (
                        <Button
                            title="Back to the list"
                            type="button"
                            variant="ghost"
                            color="gray"
                            size="small"
                            onClick={() => {
                                set_editing(undefined);
                                set_handing(undefined);
                                set_status(undefined);
                            }}
                            className="px-2! text-[12px]"
                        >
                            Back
                        </Button>
                    ) : null}
                </Row>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {editing
                        ? `${name} gets this brief as a task at every run, and the result lands here.`
                        : handing
                          ? `It keeps its schedule and where it runs; from then on its results land in the new bot's conversation.`
                          : workspace?.id
                          ? `Work ${name} does on a schedule in ${place}. Each run is a task, and its result lands here.`
                          : `Work ${name} does on its own, on a schedule. Each run is a task, and its result lands here.`}
                </Span>
            </Stack>

            <Stack className="mt-4 max-h-[55vh] w-full gap-0! items-stretch overflow-y-auto">
                {editing ? (
                    <RoutineForm
                        key={editing.id}
                        cron_job={editing}
                        onCancel={() => set_editing(undefined)}
                        onSaved={({ cron_job }) => {
                            replace({ cron_job });
                            set_editing(undefined);
                            set_status({ success: true, msg: "Saved." });
                        }}
                    />
                ) : handing ? (
                    <HandOverForm<CronJobWithNames>
                        key={handing.id}
                        what={`"${handing.title}"`}
                        targets_path="routines/hand-over-targets"
                        submit_path="routines/hand-over-routine"
                        body={{ cron_job_id: handing.id }}
                        onCancel={() => set_handing(undefined)}
                        onHandedOver={({ saved, msg }) => {
                            setRoutines((prev) => dropRoutine({ routines: prev, cron_job_id: saved.id }));
                            set_handing(undefined);
                            set_status({ success: true, msg });
                        }}
                    />
                ) : (
                    <SettingsList
                        is_empty={!routines.length}
                        empty={loading ? "Loading routines..." : error || "No routines here yet."}
                    >
                        {routines.map((cron_job) => (
                            <RoutineRow
                                key={cron_job.id}
                                cron_job={cron_job}
                                compact
                                busy={busy}
                                onToggle={() => toggle({ cron_job }).catch(() => {})}
                                onEdit={() => set_editing(cron_job)}
                                onHandOver={() => set_handing(cron_job)}
                                onDelete={() => remove({ cron_job }).catch(() => {})}
                            />
                        ))}
                    </SettingsList>
                )}
            </Stack>

            <Stack className="mt-3 gap-1! items-stretch">
                <SettingsStatus status={status} />
                {editing || handing ? null : (
                    <Span className="text-[12px] leading-4 text-ink-secondary">
                        {`Ask ${name} in chat to set one up, or change one here.`}
                    </Span>
                )}
            </Stack>
        </Modal>
    );
}
