import { useContext } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import { Check, Monitor } from "lucide-react";
import { BotComputersContext } from "../(data)/bot-computers-context";

type Props = {
    computer_id: number;
};

/**
 * A computer the bot named in a message (`computerRef`): a button that
 * switches the bot to it at once, or a checked chip when it's already on
 * it. A computer the bot can't use (any more) is shown by name only.
 */
export default function ComputerRefChip({ computer_id }: Props) {
    const { computers, switching_id, error, switchComputer } = useContext(BotComputersContext);

    const index = computers.findIndex((c) => c.id == computer_id);
    const computer = computers[index];
    const name = computer?.name || `computer ${computer_id}`;

    if (!computer) {
        return <Span className="font-bold">{name}</Span>;
    }

    if (index == 0) {
        return (
            <Span
                title="The computer this bot is on"
                className="inline-flex h-6 gap-1.5 items-center px-2 align-middle rounded-default-xs bg-sunken text-[13px] font-bold leading-4 text-ink whitespace-nowrap"
            >
                <Monitor size={14} aria-hidden />
                {name}
                <Check size={14} aria-hidden />
            </Span>
        );
    }

    return (
        <Button
            type="button"
            variant="outlined"
            color="gray"
            size="smaller"
            title={error && switching_id == undefined ? error : `Switch to ${name}`}
            loading={switching_id == computer_id}
            disabled={Boolean(switching_id)}
            onClick={() => switchComputer({ computer_id })}
            className="inline-flex h-6 gap-1.5! flex-nowrap align-middle px-2! text-[13px] font-bold text-ink whitespace-nowrap"
        >
            <Monitor size={14} aria-hidden className="shrink-0" />
            {name}
        </Button>
    );
}
