import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BotTraceRow } from "@/src/types";
import traceEntryView from "../(utils)/trace-entry-view";
import TraceBlock from "./trace-block";
import TraceMetaTag from "./trace-meta-tag";

type Props = {
    entry: BotTraceRow;
};

/**
 * One thing a run did: a turn with what the model reasoned and answered,
 * a tool call with what it was sent and what it answered, or an event the
 * loop kept (it ran out of room, the answer was sent back, the user wrote
 * again).
 */
export default function TraceEntryRow({ entry }: Props) {
    const view = traceEntryView({ entry });

    return (
        <Stack className="w-full gap-2 items-stretch">
            <Row className="w-full gap-1.5 items-center flex-wrap">
                <Span className="min-w-0 truncate text-sm font-medium leading-5 text-ink">
                    {view.title}
                </Span>
                {view.meta.map((meta) => (
                    <TraceMetaTag key={meta}>{meta}</TraceMetaTag>
                ))}
                {view.failed ? (
                    <TraceMetaTag color="error">failed</TraceMetaTag>
                ) : null}
            </Row>
            {view.text ? <TraceBlock text={view.text} /> : null}
            {view.reasoning ? (
                <TraceBlock label="What it reasoned" text={view.reasoning} />
            ) : null}
            {view.arguments ? (
                <TraceBlock label="What it was sent" kind="code" text={view.arguments} />
            ) : null}
            {view.result ? (
                <TraceBlock label="What it answered" kind="code" text={view.result} />
            ) : null}
        </Stack>
    );
}