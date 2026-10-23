import { useContext } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import { Check, Monitor } from "lucide-react";
import { twMerge } from "tailwind-merge";
import { BotComputersContext } from "../(data)/bot-computers-context";

type Props = {
    computer_id: number;
};

/**
 * A computer the bot named in a message (`computerRef`): a chip that opens
 * it in the viewer, in its browser. The one the bot is already on says so,
 * sunken with a check. A computer the bot can't use (any more) is shown by
 * name only.
 */
export default function ComputerRefChip({ computer_id }: Props) {
    const { computers, openComputer } = useContext(BotComputersContext);

    const computer = computers.find((c) => c.id == computer_id);
    const name = computer?.name || `computer ${computer_id}`;

    if (!computer?.id) {
        return <Span className="font-bold">{name}</Span>;
    }

    const current = computers[0]?.id == computer.id;

    return (
        <Button
            type="button"
            variant="outlined"
            color="gray"
            size="smaller"
            title={`Open ${name}`}
            onClick={() =>
                openComputer({ computer_id: computer.id || 0, mode: "browser" })
            }
            className={twMerge(
                "inline-flex h-6 gap-1.5! flex-nowrap align-middle px-2! text-[13px] font-bold whitespace-nowrap text-ink dark:text-ink",
                current
                    ? "bg-sunken hover:bg-sunken outline-0"
                    : "bg-transparent hover:bg-sunken",
            )}
        >
            <Monitor size={14} aria-hidden className="shrink-0" />
            {name}
            {current ? <Check size={14} aria-hidden className="shrink-0" /> : null}
        </Button>
    );
}
