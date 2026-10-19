import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotFace, BotHue } from "@/src/dict/bot-dict";
import type { CronJobWithNames } from "@/src/types";
import SettingsListRow from "@/src/pages/admin/settings/(partials)/settings-list-row";
import SettingsRowAction from "@/src/pages/admin/settings/(partials)/settings-row-action";
import routineSubtitle from "../(utils)/routine-subtitle";

type Props = {
    cron_job: CronJobWithNames;
    busy?: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
};

/**
 * One routine: its bot's avatar, its name (Paused or Done when it is),
 * whose it is and when it runs, then Chat, Pause or Resume, Edit, Delete.
 */
export default function RoutineRow({ cron_job, busy, onToggle, onEdit, onDelete }: Props) {
    const title = cron_job.title || `Routine ${cron_job.id}`;
    const done = Boolean(cron_job.max_runs && Number(cron_job.run_count || 0) >= cron_job.max_runs);
    const chat_url = cron_job.workspace_id
        ? `/admin/workspaces/${cron_job.workspace_id}/bots/${cron_job.bot_id}`
        : `/admin/bots/${cron_job.bot_id}`;

    return (
        <SettingsListRow
            avatar={
                <BotAvatar
                    image_media_id={cron_job.bot_image_media_id}
                    hue={(cron_job.bot_kind == "coordinator" ? null : cron_job.bot_hue || null) as BotHue | null}
                    face={(cron_job.bot_face || "idle") as BotFace}
                />
            }
            title={title}
            badge={cron_job.enabled ? undefined : done ? "Done" : "Paused"}
            subtitle={routineSubtitle({ cron_job })}
        >
            <SettingsRowAction title={`Chat with ${cron_job.bot_name || "the bot"}`} label="Chat" href={chat_url} />
            <SettingsRowAction
                title={cron_job.enabled ? `Pause ${title}` : `Resume ${title}`}
                label={cron_job.enabled ? "Pause" : "Resume"}
                disabled={busy}
                onClick={onToggle}
            />
            <SettingsRowAction title={`Edit ${title}`} label="Edit" disabled={busy} onClick={onEdit} />
            <SettingsRowAction title={`Delete ${title}`} label="Delete" disabled={busy} onClick={onDelete} />
        </SettingsListRow>
    );
}
