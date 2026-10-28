import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import type { ChatroomBot } from "@/src/types";
import ChatroomStone from "./chatroom-stone";

type Props = {
    bots: ChatroomBot[];
};

/**
 * The square the cluster fills (`w-7 h-7`), the size of a rail avatar.
 */
const ClusterSize = 28;

/**
 * A chatroom's bots packed into one avatar-sized square: the asking bot
 * on top, the two below it in a triangle (four make a square, the rest
 * are left out). Stones stay small and apart: never overlapping, in a
 * badge or outlined. One bot fills the square alone.
 */
export default function ChatroomStoneCluster({ bots }: Props) {
    const shown = bots.slice(0, 4);
    const stone = Math.floor((ClusterSize - 2) / 2);

    if (shown.length <= 1) {
        return shown[0] ? <ChatroomStone bot={shown[0]} size={ClusterSize} /> : null;
    }

    const top = shown.length == 3 ? shown.slice(0, 1) : shown.slice(0, 2);
    const bottom = shown.length == 2 ? [] : shown.slice(top.length);

    return (
        <Stack className="shrink-0 gap-0.5! items-center justify-center w-7 h-7">
            <Row className="gap-0.5! flex-nowrap justify-center">
                {top.map((bot) => (
                    <ChatroomStone key={bot.id} bot={bot} size={stone} />
                ))}
            </Row>
            {bottom.length ? (
                <Row className="gap-0.5! flex-nowrap justify-center">
                    {bottom.map((bot) => (
                        <ChatroomStone key={bot.id} bot={bot} size={stone} />
                    ))}
                </Row>
            ) : null}
        </Stack>
    );
}
