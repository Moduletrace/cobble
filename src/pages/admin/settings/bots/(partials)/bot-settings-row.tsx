import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotFace, BotHue } from "@/src/dict/bot-dict";
import type { BotWithLastMessage } from "@/src/types";
import SettingsListRow from "../../(partials)/settings-list-row";
import SettingsRowAction from "../../(partials)/settings-row-action";

type Props = {
    bot: BotWithLastMessage;
    busy?: boolean;
    onEdit: () => void;
    onDelete: () => void;
};

/**
 * One bot: its stone or picture, name and job, then Chat, Edit, and for a
 * worker its Models and Delete.
 */
export default function BotSettingsRow({ bot, busy, onEdit, onDelete }: Props) {
    const name = bot.name || `Bot ${bot.id}`;
    const is_coordinator = bot.kind == "coordinator";

    return (
        <SettingsListRow
            avatar={
                <BotAvatar
                    image_media_id={bot.image_media_id}
                    hue={(bot.hue || null) as BotHue | null}
                    face={(bot.face || "idle") as BotFace}
                />
            }
            title={name}
            subtitle={bot.role || (is_coordinator ? "Coordinates your crew and hands work to it" : undefined)}
        >
            <SettingsRowAction title={`Chat with ${name}`} label="Chat" href={`/admin/bots/${bot.id}`} />
            <SettingsRowAction title={`Edit ${name}`} label="Edit" disabled={busy} onClick={onEdit} />
            {is_coordinator ? null : (
                <>
                    <SettingsRowAction title={`${name}'s models`} label="Models" href={`/admin/bots/${bot.id}/models`} />
                    <SettingsRowAction title={`Delete ${name}`} label="Delete" disabled={busy} onClick={onDelete} />
                </>
            )}
        </SettingsListRow>
    );
}
