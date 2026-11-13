import { useContext } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import { ArrowUpRight } from "lucide-react";
import { BotMessageActionsContext } from "../(data)/message-actions-context";

type Props = {
    step: string;
};

/**
 * One suggested next step, a button that puts it in the user's input (it
 * never sends on its own).
 */
export default function BotSuggestionChip({ step }: Props) {
    const { onUseSuggestion } = useContext(BotMessageActionsContext);

    return (
        <Button
            type="button"
            variant="outlined"
            color="gray"
            size="smaller"
            title={`Put this in your input: ${step}`}
            className="inline-flex h-auto max-w-full gap-1! flex-nowrap align-middle px-2! py-1! text-left text-[13px] font-normal whitespace-normal [&_.twui-button-content-wrapper]:min-w-0"
            onClick={() => onUseSuggestion({ text: step })}
        >
            <Span className="min-w-0">{step}</Span>
            <ArrowUpRight size={14} aria-hidden className="shrink-0" />
        </Button>
    );
}