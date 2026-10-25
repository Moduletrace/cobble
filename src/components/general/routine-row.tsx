import type { BotFace } from "@/src/dict/bot-dict";
import botStoneProps from "@/src/utils/bot-stone-props";
import type { CronJobWithNames } from "@/src/types";
import SettingsListRow from "@/src/pages/admin/settings/(partials)/settings-list-row";
import SettingsRowAction from "@/src/pages/admin/settings/(partials)/settings-row-action";
import routineSubtitle from "@/src/utils/routine-subtitle";
import BotAvatar from "./bot-avatar";

type Props = {
    cron_job: CronJobWithNames;
    busy?: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onDelete: () => void;
    /**
     * Hand it to another bot where it runs.
     */
    onHandOver?: () => void;
    /**
     * In a conversation's own modal the Chat link and the bot's and
     * workspace's names are already the ones on screen.
     */
    compact?: boolean;
};

/**
 * One routine: its bot's avatar, its name (Paused or Done when it is),
 * whose it is and when it runs, then Chat, Pause or Resume, Edit, Hand
 * over, Delete.
 */
export default function RoutineRow({ cron_job, busy, onToggle, onEdit, onDelete, onHandOver, compact }: Props) {
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
                    {...botStoneProps({ color: cron_job.bot_color, stone: cron_job.bot_stone, hue: cron_job.bot_hue })}
                    face={(cron_job.bot_face || "idle") as BotFace}
                />
            }
            title={title}
            badge={cron_job.enabled ? undefined : done ? "Done" : "Paused"}
            subtitle={routineSubtitle({
                cron_job,
                show_bot: !compact,
                show_workspace: !compact,
            })}
        >
            {compact ? null : (
                <SettingsRowAction title={`Chat with ${cron_job.bot_name || "the bot"}`} label="Chat" href={chat_url} />
            )}
            <SettingsRowAction
                title={cron_job.enabled ? `Pause ${title}` : `Resume ${title}`}
                label={cron_job.enabled ? "Pause" : "Resume"}
                disabled={busy}
                onClick={onToggle}
            />
            <SettingsRowAction title={`Edit ${title}`} label="Edit" disabled={busy} onClick={onEdit} />
            {onHandOver ? (
                <SettingsRowAction
                    title={`Hand ${title} to another bot`}
                    label="Hand over"
                    disabled={busy}
                    onClick={onHandOver}
                />
            ) : null}
            <SettingsRowAction title={`Delete ${title}`} label="Delete" disabled={busy} onClick={onDelete} />
        </SettingsListRow>
    );
}
