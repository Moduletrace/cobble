import Span from "@moduletrace/twui/layout/Span";
import BotAvatar from "@/src/components/general/bot-avatar";
import { AppData } from "@/src/data/app-data";
import type { BotFace } from "@/src/dict/bot-dict";
import botStoneProps from "@/src/utils/bot-stone-props";
import SettingsListRow from "@/src/pages/admin/settings/(partials)/settings-list-row";
import type { WorkspaceActivityItem } from "@/src/types";
import messagePreview from "@/src/utils/message-preview";
import relativeTime from "@/src/utils/relative-time";

type Props = {
    workspace_id: number;
    item: WorkspaceActivityItem;
};

/**
 * One recent conversation in the workspace: the bot, the session's title
 * (what it opened with until it's named), a preview of its latest message
 * and when it last moved.
 */
export default function WorkspaceActivityRow({ workspace_id, item }: Props) {
    const at = item.last_activity_at || item.created_at;
    const preview = item.last_message_text
        ? messagePreview({ text: item.last_message_text })
        : "";
    const opening = item.first_message_text
        ? messagePreview({ text: item.first_message_text }).slice(0, AppData.BotSessionTitleMaxChars)
        : "";

    return (
        <SettingsListRow
            avatar={
                <BotAvatar
                    image_media_id={item.bot_image_media_id}
                    {...botStoneProps({ color: item.bot_color, stone: item.bot_stone, hue: item.bot_hue })}
                    face={(item.bot_face || "idle") as BotFace}
                />
            }
            title={item.title || opening || "Untitled conversation"}
            href={`/admin/workspaces/${workspace_id}/bots/${item.bot_id}`}
            badge={item.unread ? "New" : undefined}
            subtitle={`${item.bot_name || "A bot"}${preview ? ` · ${preview}` : ""}`}
        >
            <Span className="text-[11px] leading-4 text-ink-secondary">
                {at ? relativeTime({ at: Number(at) }) : ""}
            </Span>
        </SettingsListRow>
    );
}
