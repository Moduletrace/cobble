import { History, Pause, Pencil, Play, RefreshCw, Trash2 } from "lucide-react";
import type { BotFace } from "@/src/dict/bot-dict";
import type { BotHookWithNames } from "@/src/types";
import SettingsListRow from "@/src/pages/admin/settings/(partials)/settings-list-row";
import SettingsRowMenu from "@/src/pages/admin/settings/(partials)/settings-row-menu";
import SettingsRowMenuItem from "@/src/pages/admin/settings/(partials)/settings-row-menu-item";
import SettingsRowMenuPanel from "@/src/pages/admin/settings/(partials)/settings-row-menu-panel";
import botStoneProps from "@/src/utils/bot-stone-props";
import hookRunnerState from "@/src/utils/hook-runner-state";
import hookSubtitle from "@/src/utils/hook-subtitle";
import BotAvatar from "./bot-avatar";

type Props = {
    hook: BotHookWithNames;
    busy?: boolean;
    /**
     * Opens the hook: what it is and its thread of calls.
     */
    onOpen: () => void;
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
 * One hook: its bot's avatar, its name (Paused, Silent when it is silent
 * about its runs), which opens it, what calls it, how often it ran and
 * when it was last called, then a menu with Pause or Resume, Edit, Calls,
 * New URL (not for notification hooks: their URL is never shown) and
 * Delete.
 */
export default function HookRow({ hook, busy, onOpen, onToggle, onEdit, onCalls, onRotate, onDelete, compact }: Props) {
    const title = hook.title || `Hook ${hook.id}`;
    const runner = hookRunnerState({ hook });
    const badge = !hook.enabled
        ? "Paused"
        : hook.silent
          ? "Silent"
          : runner.configured && !runner.running
            ? "Runner down"
            : undefined;

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
            onOpen={onOpen}
            badge={badge}
            subtitle={hookSubtitle({ hook, show_bot: !compact, show_workspace: !compact })}
        >
            <SettingsRowMenu title={`${title} menu`} disabled={busy}>
                <SettingsRowMenuPanel>
                    <SettingsRowMenuItem
                        icon={hook.enabled ? Pause : Play}
                        title={hook.enabled ? "Pause" : "Resume"}
                        description={hook.enabled ? `Pause ${title}` : `Resume ${title}`}
                        onClick={onToggle}
                    />
                    <SettingsRowMenuItem icon={Pencil} title="Edit" description={`Edit ${title}`} onClick={onEdit} />
                    <SettingsRowMenuItem
                        icon={History}
                        title="Calls"
                        description={`Recent calls to ${title}`}
                        onClick={onCalls}
                    />
                    {hook.source == "browser_notifications" ? null : (
                        <SettingsRowMenuItem
                            icon={RefreshCw}
                            title="New URL"
                            description={`Give ${title} a new URL`}
                            onClick={onRotate}
                        />
                    )}
                    <SettingsRowMenuItem icon={Trash2} title="Delete" description={`Delete ${title}`} onClick={onDelete} />
                </SettingsRowMenuPanel>
            </SettingsRowMenu>
        </SettingsListRow>
    );
}