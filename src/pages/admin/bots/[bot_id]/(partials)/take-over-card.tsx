import { useContext } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import { Computer, Hand, Monitor, MonitorCog, MonitorDot } from "lucide-react";
import {
    ComputerViewModes,
    type ComputerViewMode,
} from "@/src/dict/computer-dict";
import { BotComputersContext } from "../(data)/bot-computers-context";
import {
    LastUserMessageContext,
    MessageIdContext,
} from "../(data)/message-answer-context";
import RefCardShell from "./ref-card-shell";
import Center from "@moduletrace/twui/layout/Center";
import Stack from "@moduletrace/twui/layout/Stack";
import Divider from "@moduletrace/twui/layout/Divider";

type Props = {
    computer_id: number;
    mode: ComputerViewMode;
};

/**
 * The bot asked the user to take over a computer (`takeOverRef`): the card
 * that opens it in the viewer, in the mode the bot asked for. It's a block
 * of its own in the message (`isCardRefHref`), so a request buried in a long
 * answer still stands out. It waits for them only while no user message
 * follows the one it was written in, so handing the computer back ends it.
 * A computer the bot can't use (any more) is shown by name only.
 */
export default function TakeOverCard({ computer_id, mode }: Props) {
    const { computers, openComputer } = useContext(BotComputersContext);
    const last_user_id = useContext(LastUserMessageContext);
    const message_id = useContext(MessageIdContext);

    const computer = computers.find((c) => c.id == computer_id);
    const name = computer?.name || `computer ${computer_id}`;
    const mode_title =
        ComputerViewModes.find((m) => m.value == mode)?.title || mode;
    const waiting = Boolean(
        message_id && last_user_id && message_id > last_user_id,
    );

    if (!computer) {
        return <Span className="font-bold">{name}</Span>;
    }

    return (
        <Stack
            className="cursor-pointer w-full hover:opacity-70"
            onClick={() => openComputer({ computer_id, mode, take_over: true })}
        >
            <RefCardShell
                icon={<Hand size={14} aria-hidden />}
                title={`Take over ${name}`}
                status={waiting ? "Waiting for you" : mode_title}
                tone={waiting ? "warning" : "gray"}
                description={
                    waiting
                        ? `The bot is waiting for you to do this on its ${mode_title.toLowerCase()} screen. Do what's needed, then hand it back from the viewer and the bot carries on.`
                        : `What the bot needed you to do on its ${mode_title.toLowerCase()} screen.`
                }
            >
                <Center className="p-10">
                    <Monitor opacity={0.2} size={60} strokeWidth={1} />
                </Center>
                <Divider />
                <Button
                    type="button"
                    size="small"
                    title={`Open ${name} (${mode_title}) and take over`}
                    beforeIcon={<Hand size={14} aria-hidden />}
                    className="w-full"
                    variant="ghost"
                >
                    {`Open ${name}`}
                </Button>
            </RefCardShell>
        </Stack>
    );
}
