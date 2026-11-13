import { useEffect, useMemo, useRef, type RefObject } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import useBotTrace from "../(hooks)/use-bot-trace";
import TraceLogLine from "./trace-log-line";

type Props = {
    /**
     * The session the thinking row belongs to: the run it shows is one of
     * this session's jobs.
     */
    session_id?: number | null;
    /**
     * The logs are on screen. Nothing is read, and no push is taken, while
     * it's closed.
     */
    open: boolean;
};

/**
 * How far from the bottom the logs still follow new lines: a little slack,
 * so a line that just landed doesn't stop them.
 */
const FollowSlackPx = 24;

/**
 * The debug logs under the thinking row: what the run working right now
 * did, turn by turn and tool by tool, as it goes. A quarter-screen tall
 * strip that follows its newest line while it's scrolled to the bottom,
 * and stays where the user scrolled when it isn't. Once the run ends the
 * strip goes with the thinking row, and its log is under the response's
 * Details > Debug logs (`grabMessageTraces`).
 */
export default function TracePanel({ session_id, open }: Props) {
    const { jobs, loading, error, reload } = useBotTrace({ session_id, open });
    const scroll_ref = useRef<HTMLDivElement | null>(null);
    const follow = useRef(true);

    const job = useMemo(
        () => jobs.find((run) => run.status == "processing") || jobs.find((run) => run.status == "pending"),
        [jobs],
    );
    const entries = job?.traces || [];
    const newest = entries[entries.length - 1]?.id;

    useEffect(() => {
        if (!follow.current) return;

        const element = scroll_ref.current;

        if (element) element.scrollTop = element.scrollHeight;
    }, [newest, open]);

    return (
        <Stack
            role="region"
            aria-label="Debug logs"
            className="w-full h-[250px] mt-2 gap-0! items-stretch overflow-hidden rounded-default border border-solid border-hairline bg-surface"
        >
            <Row className="w-full shrink-0 flex-nowrap items-center gap-2! border-0 border-b border-solid border-hairline px-3 py-1.5">
                <Span className="text-[11px] leading-4 uppercase tracking-wide text-ink-secondary">
                    Debug logs
                </Span>
                {job?.status == "processing" ? (
                    <Span className="ml-auto text-[11px] leading-4 text-ink-disabled">Live</Span>
                ) : null}
            </Row>
            <Stack
                componentRef={scroll_ref as RefObject<HTMLDivElement>}
                onScroll={() => {
                    const element = scroll_ref.current;

                    if (!element) return;

                    follow.current =
                        element.scrollHeight - element.scrollTop - element.clientHeight <=
                        FollowSlackPx;
                }}
                className="grow min-h-0 gap-0! items-stretch overflow-y-auto overscroll-contain px-3 py-2"
            >
                {error ? (
                    <Stack className="w-full gap-1! items-start">
                        <Span className="text-xs leading-4 text-ink-secondary">{error}</Span>
                        <Button
                            title="Read the logs again"
                            type="button"
                            variant="ghost"
                            color="gray"
                            size="smaller"
                            onClick={() => {
                                void reload();
                            }}
                        >
                            Try again
                        </Button>
                    </Stack>
                ) : entries.length ? (
                    entries.map((entry) => <TraceLogLine key={entry.id} entry={entry} />)
                ) : (
                    <Span className="text-xs leading-4 text-ink-secondary">
                        {loading && !job
                            ? "Reading the run..."
                            : job
                              ? "Waiting for the bot's first step..."
                              : "Nothing is running here."}
                    </Span>
                )}
            </Stack>
        </Stack>
    );
}