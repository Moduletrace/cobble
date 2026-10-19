import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotFace, BotHue } from "@/src/dict/bot-dict";
import type { BotWithLastMessage } from "@/src/types";
import type { MessageGroup } from "../(utils)/group-messages";
import BotMessageLine from "./bot-message-line";
import GroupTimestamp from "./group-timestamp";

type Props = {
    bot: BotWithLastMessage;
    group: MessageGroup;
};

/**
 * Plain text, no bubble. A 28px stone sits on the group's first line only.
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
                {group.messages.map((message) => (
                    <BotMessageLine
                        key={message.id}
                        message_id={message.id || null}
                        text={message.text || ""}
                        needs_you={Boolean(message.needs_you)}
                    />
                ))}
                <GroupTimestamp at={group.at} />
            </Stack>
        </Row>
    );
}
