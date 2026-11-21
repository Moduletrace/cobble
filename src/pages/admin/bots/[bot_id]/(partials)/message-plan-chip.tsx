import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import { ListChecks } from "lucide-react";
import BotPlanModal from "./bot-plan-modal";

type Props = {
    plan_id: number;
};

/**
 * The plan a bot message belongs to, under it: the one it wrote, or the
 * step it worked. Opens the plan where it stands, so a step report deep in
 * the thread still leads to it.
 */
export default function MessagePlanChip({ plan_id }: Props) {
    const [open, set_open] = useState(false);

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                title="Open the plan"
                onClick={() => set_open(true)}
                className="inline-flex h-6 max-w-full gap-1.5! flex-nowrap items-center px-1.5! py-0! align-middle rounded-default-xs border-0 bg-sunken hover:bg-sunken text-ink dark:bg-sunken dark:hover:bg-sunken dark:text-ink [&_.twui-button-content-wrapper]:min-w-0"
            >
                <ListChecks size={13} aria-hidden className="shrink-0" />
                <Span className="min-w-0 truncate text-[13px] font-bold leading-4 whitespace-nowrap">Plan</Span>
            </Button>
            <BotPlanModal plan_id={plan_id} open={open} onClose={() => set_open(false)} />
        </>
    );
}