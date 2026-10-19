import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotFace, BotHue } from "@/src/dict/bot-dict";
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
            hue={(bot.hue || null) as BotHue | null}
            face={(bot.face || "idle") as BotFace}
            size={18}
        />
    );
}
