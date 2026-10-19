import { useContext } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import { Hand } from "lucide-react";
import { ComputerViewModes, type ComputerViewMode } from "@/src/dict/computer-dict";
import { BotComputersContext } from "../(data)/bot-computers-context";

type Props = {
    computer_id: number;
    mode: ComputerViewMode;
};

/**
 * The bot asked the user to take over a computer (`takeOverRef`): a
 * button that opens it in the viewer, in the mode the bot asked for. A
 * computer the bot can't use (any more) is shown by name only.
 */
export default function TakeOverChip({ computer_id, mode }: Props) {
    const { computers, openComputer } = useContext(BotComputersContext);

    const computer = computers.find((c) => c.id == computer_id);
    const name = computer?.name || `computer ${computer_id}`;
    const mode_title = ComputerViewModes.find((m) => m.value == mode)?.title || mode;

    if (!computer) {
        return <Span className="font-bold">{name}</Span>;
    }

    return (
        <Button
            type="button"
            variant="outlined"
            color="gray"
            size="smaller"
            title={`Open ${name} (${mode_title}) and take over`}
            onClick={() => openComputer({ computer_id, mode, take_over: true })}
            className="inline-flex h-6 gap-1.5! flex-nowrap align-middle px-2! text-[13px] font-bold text-ink whitespace-nowrap"
        >
            <Hand size={14} aria-hidden className="shrink-0" />
            {`Take over ${name} · ${mode_title}`}
        </Button>
    );
}
