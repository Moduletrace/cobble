import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotFace } from "@/src/dict/bot-dict";
import botStoneProps from "@/src/utils/bot-stone-props";
import type { BotWithLastMessage } from "@/src/types";
import SettingsListRow from "../../(partials)/settings-list-row";
import SettingsRowAction from "../../(partials)/settings-row-action";

type Props = {
    bot: BotWithLastMessage;
    busy?: boolean;
    onDelete: () => void;
};

/**
 * One bot: its stone or picture, name and job. The title opens its
 * settings page; Chat and, for a worker, Delete sit at the end.
 */
export default function BotSettingsRow({ bot, busy, onDelete }: Props) {
    const name = bot.name || `Bot ${bot.id}`;
    const is_coordinator = bot.kind == "coordinator";

    return (
        <SettingsListRow
            avatar={
                <BotAvatar
                    image_media_id={bot.image_media_id}
                    {...botStoneProps({ color: bot.color, stone: bot.stone, hue: bot.hue })}
                    face={(bot.face || "idle") as BotFace}
                />
            }
            href={`/admin/settings/bots/${bot.id}`}
            title={name}
            subtitle={bot.role || (is_coordinator ? "Coordinates your crew and hands work to it" : undefined)}
        >
            <SettingsRowAction title={`Chat with ${name}`} label="Chat" href={`/admin/bots/${bot.id}`} />
            {is_coordinator ? null : (
                <SettingsRowAction title={`Delete ${name}`} label="Delete" disabled={busy} onClick={onDelete} />
            )}
        </SettingsListRow>
    );
}
