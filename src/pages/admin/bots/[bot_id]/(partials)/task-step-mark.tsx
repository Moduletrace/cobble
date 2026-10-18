import Span from "@moduletrace/twui/layout/Span";
import { Check } from "lucide-react";

/**
 * 14px step mark. Pending has no mark; its label is muted.
 */
export default function TaskStepMark({ state }: { state: string }) {
    if (state === "done") {
        return (
            <Check
                size={14}
                strokeWidth={1.6 * (24 / 14)}
                className="shrink-0 text-ink"
                aria-label="Done"
            />
        );
    }

    if (state === "active") {
        return (
            <Span className="size-3.5 shrink-0 flex items-center justify-center" aria-label="In progress" role="img">
                <Span className="size-1.5 rounded-full bg-ink" />
            </Span>
        );
    }

    return <Span className="size-3.5 shrink-0" aria-hidden />;
}
