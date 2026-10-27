import BotAvatar from "@/src/components/general/bot-avatar";
import botStoneProps from "@/src/utils/bot-stone-props";
import type { ChatroomBot } from "@/src/types";

type Props = {
    bot: ChatroomBot;
    size?: number;
    /**
     * Its face while it works in the room (left out, the resting face).
     */
    face?: "working" | "idle";
};

/**
 * One bot of a chatroom, drawn as its stone (or picture). The coordinator
 * stays hue-less.
 */
export default function ChatroomStone({ bot, size = 18, face }: Props) {
    return (
        <BotAvatar
            image_media_id={bot.image_media_id}
            {...botStoneProps({ color: bot.color, stone: bot.stone, hue: bot.hue })}
            label={bot.name || ""}
            size={size}
            face={face}
        />
    );
}
