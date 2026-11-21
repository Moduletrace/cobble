import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import Tag from "@moduletrace/twui/elements/Tag";
import { twMerge } from "tailwind-merge";
import { ChevronRight, ListChecks } from "lucide-react";
import { BotPlanOpenStates, BotPlanStates } from "@/src/dict/bot-plan-dict";
import type { BotPlanView } from "@/src/types";
import BotPlanModal from "./bot-plan-modal";

type Props = {
    plan: BotPlanView | null;
};

/**
 * The plan open in the conversation, above the thread: its title, where it
 * stands and how far it got, so the plan is not lost above a long thread
 * or in an older session. Only one plan is open per conversation; a
 * finished or cancelled one is history and leaves the bar.
 */
export default function SessionPlanBar({ plan }: Props) {
    const [open, set_open] = useState(false);

    if (!plan || !BotPlanOpenStates.includes(plan.status)) return null;

    const status = BotPlanStates.find((state) => state.value == plan.status)?.title || plan.status;
    const color = plan.status == "active" ? "success" : plan.status == "paused" ? "warning" : "gray";
    const step = Math.min(plan.finished_steps + 1, plan.total_steps);
    const progress =
        plan.status == "planned"
            ? `${plan.total_steps} step${plan.total_steps == 1 ? "" : "s"}`
            : plan.status == "paused"
              ? `Paused at step ${step} of ${plan.total_steps}`
              : `Step ${step} of ${plan.total_steps}`;

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                color="gray"
                title="Open the plan"
                onClick={() => set_open(true)}
                className={twMerge(
                    "w-full shrink-0 justify-start gap-2! rounded-none! border-0 border-b border-solid border-hairline bg-surface px-3! py-2! text-left md:px-6!",
                    "[&_.twui-button-content-wrapper]:w-full [&_.twui-button-content-wrapper]:min-w-0 [&_.twui-button-content-wrapper]:justify-start",
                )}
            >
                <ListChecks size={14} aria-hidden className="shrink-0 text-ink-secondary" />
                <Span className="min-w-0 grow truncate text-[13px] leading-5 font-bold text-ink">
                    {plan.title || `Plan ${plan.id}`}
                </Span>
                <Tag color={color} className="shrink-0">
                    {status}
                </Tag>
                <Span className="shrink-0 text-[12px] leading-4 text-ink-secondary whitespace-nowrap">
                    {progress}
                </Span>
                <ChevronRight size={14} aria-hidden className="shrink-0 text-ink-secondary" />
            </Button>
            <BotPlanModal plan_id={plan.id} open={open} onClose={() => set_open(false)} />
        </>
    );
}