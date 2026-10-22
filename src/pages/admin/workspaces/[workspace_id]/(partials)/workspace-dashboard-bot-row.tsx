import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotFace } from "@/src/dict/bot-dict";
import botStoneProps from "@/src/utils/bot-stone-props";
import SettingsListRow from "@/src/pages/admin/settings/(partials)/settings-list-row";
import type { WorkspaceBot } from "@/src/types";

type Props = {
    workspace_id: number;
    bot: WorkspaceBot;
};

/**
 * A bot in the workspace list: its face, name and how it works here, its
 * row opening its conversation.
 */
export default function WorkspaceDashboardBotRow({ workspace_id, bot }: Props) {
    const name = bot.name || "This bot";
    const is_coordinator = bot.kind == "coordinator";
    const has_own = Boolean(bot.workspace_system_prompt || bot.workspace_memory);

    return (
        <SettingsListRow
            avatar={
                <BotAvatar
                    image_media_id={bot.image_media_id}
                    {...botStoneProps({ color: bot.color, stone: bot.stone, hue: bot.hue })}
                    face={(bot.face || "idle") as BotFace}
                />
            }
            title={name}
            href={`/admin/workspaces/${workspace_id}/bots/${bot.id}`}
            badge={is_coordinator ? "Coordinator" : undefined}
            subtitle={
                has_own
                    ? "Has instructions for this workspace"
                    : bot.role || "Uses its own instructions here"
            }
        />
    );
}
