import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BotTraceJob } from "@/src/types";
import relativeTime from "@/src/utils/relative-time";
import traceJobView from "../(utils)/trace-job-view";
import TraceEntryRow from "./trace-entry-row";
import TraceMetaTag from "./trace-meta-tag";

type Props = {
    job: BotTraceJob;
};

/**
 * One traced run: what it was, when it started and the state it was left
 * in, over everything it did in order (its turns, their tool calls and the
 * loop's own events).
 */
export default function TraceJobCard({ job }: Props) {
    const view = traceJobView({ job });

    return (
        <Stack className="w-full gap-2.5 items-stretch">
            <Row className="w-full gap-1.5 items-center flex-wrap">
                <Span className="min-w-0 truncate text-sm font-semibold leading-5 text-ink">
                    {view.title}
                </Span>
                <TraceMetaTag>{view.kind_label}</TraceMetaTag>
                <TraceMetaTag color={view.status_color}>
                    {view.status_label}
                </TraceMetaTag>
                <Span className="ml-auto shrink-0 text-[11px] leading-4 text-ink-secondary">
                    {relativeTime({ at: job.created_at })}
                </Span>
            </Row>
            <Stack className="w-full gap-3 items-stretch">
                {job.traces.map((entry) => (
                    <TraceEntryRow key={entry.id} entry={entry} />
                ))}
            </Stack>
        </Stack>
    );
}