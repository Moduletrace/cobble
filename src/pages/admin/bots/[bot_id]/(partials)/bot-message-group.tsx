import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotFace, BotHue } from "@/src/dict/bot-dict";
import type { BotWithLastMessage } from "@/src/types";
import type { MessageGroup } from "../(utils)/group-messages";
import BotMessageLine from "./bot-message-line";

type Props = {
    bot: BotWithLastMessage;
    group: MessageGroup;
};

/**
 * Plain text, no bubble. A 28px stone sits on the group's first line only;
 * the group's time sits beside the last message's play button.
 */
export default function BotMessageGroup({ bot, group }: Props) {
    return (
        <Row className="w-full gap-3! flex-nowrap items-start">
            <BotAvatar
                image_media_id={bot.image_media_id}
                hue={(bot.hue || null) as BotHue | null}
                face={(bot.face || "idle") as BotFace}
                size={28}
                className="-mt-1"
            />
            <Stack className="min-w-0 grow gap-1! items-start">
                {group.messages.map((message, index) => (
                    <BotMessageLine
                        key={message.id}
                        message={message}
                        bot_name={bot.name || "the bot"}
                        at={index == group.messages.length - 1 ? group.at : undefined}
                    />
                ))}
            </Stack>
        </Row>
    );
}
