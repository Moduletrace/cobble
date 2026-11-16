import Span from "@moduletrace/twui/layout/Span";
import { twMerge } from "tailwind-merge";
import { Circle, CircleCheck, CircleSlash, CircleDot } from "lucide-react";
import type { BotPlanStep } from "@/src/types";

type Props = {
    step: BotPlanStep;
    /**
     * The step the bot is on: only one is, and only while the plan runs.
     */
    current: boolean;
};

/**
 * One step of a plan on its card: whether it's done (with the line the bot
 * wrote about what it produced), the one being worked, or still to come.
 */
export default function BotPlanStepRow({ step, current }: Props) {
    const done = step.state == "done";
    const skipped = step.state == "skipped";

    return (
        <Span className="flex w-full flex-nowrap items-start gap-2">
            <Span className="mt-0.5 flex shrink-0 items-center">
                {done ? (
                    <CircleCheck size={14} aria-hidden className="text-ink" />
                ) : skipped ? (
                    <CircleSlash size={14} aria-hidden className="text-ink-disabled" />
                ) : current ? (
                    <CircleDot size={14} aria-hidden className="text-ink" />
                ) : (
                    <Circle size={14} aria-hidden className="text-ink-disabled" />
                )}
            </Span>

            <Span className="flex min-w-0 flex-col gap-0.5">
                <Span
                    className={twMerge(
                        "text-[13px] leading-5",
                        (done || skipped) && "text-ink-secondary",
                    )}
                >
                    {step.text}
                </Span>

                {step.note ? (
                    <Span className="text-[12px] leading-4 text-ink-secondary">{step.note}</Span>
                ) : current ? (
                    <Span className="text-[12px] leading-4 text-ink-secondary">Working on this now.</Span>
                ) : null}
            </Span>
        </Span>
    );
}