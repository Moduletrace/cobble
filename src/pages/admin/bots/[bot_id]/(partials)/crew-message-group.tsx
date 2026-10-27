import Paper from "@moduletrace/twui/elements/Paper";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import BotStone from "@/src/components/general/bot-stone";
import type { MessageGroup } from "../(utils)/group-messages";
import CrewMessageLine from "./crew-message-line";

type Props = {
    group: MessageGroup;
};

/**
 * What the coordinator brought back from a chatroom, on its own paper so
 * it stands apart from the conversation: text under the hue-less
 * coordinator stone, never a user bubble, though the bot answers it like
 * one.
 */
export default function CrewMessageGroup({ group }: Props) {
    return (
        <Paper className="w-full p-4 gap-0! items-stretch rounded-default bg-surface dark:bg-surface border-hairline dark:border-hairline">
            <Row className="w-full gap-3! flex-nowrap items-start">
                <BotStone size={28} label="" className="-mt-1 shrink-0" />
                <Stack className="min-w-0 grow gap-1! items-start">
                    <Span className="text-[11px] font-bold uppercase tracking-wide leading-4 text-ink-secondary">
                        From the coordinator
                    </Span>
                    {group.messages.map((message) => (
                        <CrewMessageLine key={message.id} message={message} />
                    ))}
                </Stack>
            </Row>
        </Paper>
    );
}
