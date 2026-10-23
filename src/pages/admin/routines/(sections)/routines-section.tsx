import { useContext, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import type { CronJobWithNames } from "@/src/types";
import useSettingsList from "@/src/pages/admin/settings/(hooks)/use-settings-list";
import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";
import SettingsList from "@/src/pages/admin/settings/(partials)/settings-list";
import SettingsStatus from "@/src/pages/admin/settings/(partials)/settings-status";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import RoutineEditModal from "@/src/components/general/routine-edit-modal";
import RoutineRow from "@/src/components/general/routine-row";

/**
 * Every routine the user's bots have: chat with the bot, pause or resume
 * one, edit it, delete it. Bots create them when asked in chat.
 */
export default function RoutinesSection() {
    const { pageProps } = useContext(AppContext);
    const { items, setItems, busy, status, setStatus, remove } = useSettingsList({
        items: pageProps?.cron_jobs || [],
    });
    const [editing, setEditing] = useState<CronJobWithNames>();

    const replace = ({ cron_job }: { cron_job: CronJobWithNames }) =>
        setItems((prev) => prev.map((item) => (item.id == cron_job.id ? cron_job : item)));

    const toggle = async ({ cron_job }: { cron_job: CronJobWithNames }) => {
        setStatus(undefined);

        const res = await postAdminApi<CronJobWithNames>({
            path: "routines/update-routine",
            body: { cron_job_id: cron_job.id, enabled: !cron_job.enabled },
        });

        if (!res.success || !res.singleRes) {
            setStatus({ error: true, msg: res.msg || "That didn't work." });
            return;
        }

        replace({ cron_job: res.singleRes });
        setStatus({ success: true, msg: res.msg });
    };

    return (
        <SettingsGroup
            title="Your routines"
            description={`Ask any bot to set one up, e.g. "Every weekday at 9, sum up my inbox." Each run is a task, and its result lands in that bot's chat.`}
        >
            <SettingsList is_empty={!items.length} empty="No routines yet.">
                {items.map((cron_job) => (
                    <RoutineRow
                        key={cron_job.id}
                        cron_job={cron_job}
                        busy={busy}
                        onToggle={() => toggle({ cron_job })}
                        onEdit={() => setEditing(cron_job)}
                        onDelete={() =>
                            remove({
                                id: cron_job.id,
                                path: "routines/delete-routine",
                                body: { cron_job_id: cron_job.id },
                                confirm: `Delete the routine "${cron_job.title}"? A run already started carries on.`,
                            })
                        }
                    />
                ))}
            </SettingsList>
            <SettingsStatus status={status} />
            <RoutineEditModal
                cron_job={editing}
                onClose={() => setEditing(undefined)}
                onSaved={({ cron_job }) => {
                    replace({ cron_job });
                    setEditing(undefined);
                    setStatus({ success: true, msg: "Saved." });
                }}
            />
        </SettingsGroup>
    );
}
