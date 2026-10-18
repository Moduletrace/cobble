import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { twMerge } from "tailwind-merge";
import TaskStepMark from "./task-step-mark";

type Props = {
    label: string;
    state: string;
};

/**
 * 28px pitch. Done is a tick, active a dot with a bold label.
 */
export default function TaskStepRow({ label, state }: Props) {
    const is_active = state === "active";

    return (
        <Row
            className="h-7 gap-2.5! flex-nowrap items-center"
            aria-current={is_active ? "step" : undefined}
        >
            <TaskStepMark state={state} />
            <Span
                className={twMerge(
                    "text-[13px] leading-5 truncate",
                    is_active ? "font-bold text-ink" : "text-ink-secondary",
                    state === "pending" && "text-ink-disabled",
                )}
            >
                {label}
            </Span>
        </Row>
    );
}
