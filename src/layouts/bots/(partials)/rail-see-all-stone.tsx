import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotFace } from "@/src/dict/bot-dict";
import botStoneProps from "@/src/utils/bot-stone-props";
import type { BotWithLastMessage } from "@/src/types";

type Props = {
    bot: BotWithLastMessage;
};

/**
 * One small stone beside "See all bots".
 */
export default function RailSeeAllStone({ bot }: Props) {
    return (
        <BotAvatar
            image_media_id={bot.image_media_id}
            {...botStoneProps({ color: bot.color, stone: bot.stone, hue: bot.hue })}
            face={(bot.face || "idle") as BotFace}
            size={18}
        />
    );
}
