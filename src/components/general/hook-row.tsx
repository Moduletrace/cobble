import type { BotFace } from "@/src/dict/bot-dict";
import type { BotHookWithNames } from "@/src/types";
import SettingsListRow from "@/src/pages/admin/settings/(partials)/settings-list-row";
import SettingsRowAction from "@/src/pages/admin/settings/(partials)/settings-row-action";
import botStoneProps from "@/src/utils/bot-stone-props";
import hookSubtitle from "@/src/utils/hook-subtitle";
import BotAvatar from "./bot-avatar";

type Props = {
    hook: BotHookWithNames;
    busy?: boolean;
    onToggle: () => void;
    onEdit: () => void;
    onCalls: () => void;
    onRotate: () => void;
    onDelete: () => void;
    /**
     * In a conversation's own modal the bot's and workspace's names are
     * already the ones on screen.
     */
    compact?: boolean;
};

/**
 * One hook: its bot's avatar, its name (Paused when it is), what calls
 * it, how often it ran and when it was last called, then Pause or Resume,
 * Edit, Calls, New URL (not for notification hooks: their URL is never
 * shown) and Delete.
 */
export default function HookRow({ hook, busy, onToggle, onEdit, onCalls, onRotate, onDelete, compact }: Props) {
    const title = hook.title || `Hook ${hook.id}`;

    return (
        <SettingsListRow
            avatar={
                <BotAvatar
                    image_media_id={hook.bot_image_media_id}
                    {...botStoneProps({ color: hook.bot_color, stone: hook.bot_stone, hue: hook.bot_hue })}
                    face={(hook.bot_face || "idle") as BotFace}
                />
            }
            title={title}
            badge={hook.enabled ? undefined : "Paused"}
            subtitle={hookSubtitle({ hook, show_bot: !compact, show_workspace: !compact })}
        >
            <SettingsRowAction
                title={hook.enabled ? `Pause ${title}` : `Resume ${title}`}
                label={hook.enabled ? "Pause" : "Resume"}
                disabled={busy}
                onClick={onToggle}
            />
            <SettingsRowAction title={`Edit ${title}`} label="Edit" disabled={busy} onClick={onEdit} />
            <SettingsRowAction title={`Recent calls to ${title}`} label="Calls" disabled={busy} onClick={onCalls} />
            {hook.source == "browser_notifications" ? null : (
                <SettingsRowAction title={`Give ${title} a new URL`} label="New URL" disabled={busy} onClick={onRotate} />
            )}
            <SettingsRowAction title={`Delete ${title}`} label="Delete" disabled={busy} onClick={onDelete} />
        </SettingsListRow>
    );
}
