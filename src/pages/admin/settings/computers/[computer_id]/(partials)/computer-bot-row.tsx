import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotWithFace } from "@/src/types";
import type { BotFace } from "@/src/dict/bot-dict";
import botStoneProps from "@/src/utils/bot-stone-props";
import SettingsListRow from "../../../(partials)/settings-list-row";
import SettingsRowAction from "../../../(partials)/settings-row-action";

type Props = {
    bot: BotWithFace;
    /**
     * The bot's settings page, when the actor may open it.
     */
    href?: string;
    busy?: boolean;
    onRemove?: () => void;
};

/**
 * One bot with direct access to the computer.
 */
export default function ComputerBotRow({
    bot,
    href,
    busy,
    onRemove,
}: Props) {
    const name = bot.name || `Bot ${bot.id}`;

    return (
        <SettingsListRow
            avatar={
                <BotAvatar
                    image_media_id={bot.image_media_id}
                    {...botStoneProps({ color: bot.color, stone: bot.stone, hue: bot.hue })}
                    face={(bot.face || "idle") as BotFace}
                />
            }
            href={href}
            title={name}
            subtitle={
                bot.kind == "coordinator"
                    ? "Coordinates your crew and can use every computer"
                    : bot.role || "Worker bot"
            }
        >
            {onRemove ? (
                <SettingsRowAction
                    title={`Take ${name}'s access away`}
                    label="Remove"
                    disabled={busy}
                    onClick={onRemove}
                />
            ) : null}
        </SettingsListRow>
    );
}
