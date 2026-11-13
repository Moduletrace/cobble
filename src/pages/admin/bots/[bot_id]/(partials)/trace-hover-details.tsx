import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BotTraceRow } from "@/src/types";
import traceEntryView from "../(utils)/trace-entry-view";
import TraceHoverSection from "./trace-hover-section";

type Props = {
    entry: BotTraceRow;
};

/**
 * A step of the debug logs, whole: what the model reasoned before it
 * answered, what it wrote, what it asked the tools for, then what those
 * tools were sent and what they answered. The strip cuts each line to a
 * glance, so this is where the step is read in full (the card scrolls
 * rather than cutting anything).
 */
export default function TraceHoverDetails({ entry }: Props) {
    const view = traceEntryView({ entry });
    const summary = [view.failed ? `${view.title} (failed)` : view.title, view.duration].filter(Boolean).join(" - ");

    return (
        <Stack className="w-full gap-2! items-stretch">
            <Span className="text-[11px] leading-4 font-medium text-ink">{summary}</Span>
            {view.tools?.length ? (
                <Span className="w-full text-[11px] leading-4 text-ink-secondary">{`Asked for: ${view.tools.join(", ")}`}</Span>
            ) : null}
            {view.reasoning ? <TraceHoverSection label="Reasoned" text={view.reasoning} /> : null}
            {view.arguments ? <TraceHoverSection label="Sent" text={view.arguments} code /> : null}
            {view.text ? (
                <TraceHoverSection label={entry.kind == "event" ? "What happened" : "Wrote"} text={view.text} />
            ) : null}
            {view.result ? <TraceHoverSection label="Answered" text={view.result} code /> : null}
        </Stack>
    );
}