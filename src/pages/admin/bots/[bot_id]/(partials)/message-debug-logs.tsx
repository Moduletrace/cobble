import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppData } from "@/src/data/app-data";
import useMessageTrace from "../(hooks)/use-message-trace";
import CopyDebugLogsButton from "./copy-debug-logs-button";
import TraceJobCard from "./trace-job-card";

type Props = {
    message_id: number;
    /**
     * Set when the message was posted in a chatroom, so its run is read
     * through the room's access.
     */
    chatroom_id?: number;
};

/**
 * The debug logs tab of a message's Details modal: what the run behind it
 * did, turn by turn and tool by tool, with the arguments it wrote and the
 * answers it read. Empty once the trace has been pruned (the app setting
 * `bot_trace_keep_days`), and for the messages the app writes itself (a
 * stop, a failure notice), which no run generated.
 */
export default function MessageDebugLogs({ message_id, chatroom_id }: Props) {
    const { jobs, loading, error, reload } = useMessageTrace({ message_id, chatroom_id });

    if (error)
        return (
            <Stack className="w-full gap-1! items-start">
                <Span className="text-[13px] leading-[18px] text-ink-secondary">{error}</Span>
                <Button
                    title="Read the debug logs again"
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
        );

    if (!jobs)
        return (
            <Span className="text-[13px] leading-[18px] text-ink-secondary">
                {loading ? "Reading the run..." : "No debug logs were kept for this message."}
            </Span>
        );

    if (!jobs.length)
        return (
            <Stack className="w-full gap-1! items-stretch">
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    No debug logs were kept for this message. The app writes some messages itself (a stop,
                    a failed run's notice), and a run's logs are deleted after {AppData.BotTraceKeepDays}{" "}
                    days.
                </Span>
            </Stack>
        );

    return (
        <Stack className="w-full gap-4! items-stretch">
            <Row className="w-full flex-nowrap items-center justify-end">
                <CopyDebugLogsButton message_id={message_id} jobs={jobs} />
            </Row>
            <Stack className="w-full gap-6! items-stretch">
                {jobs.map((job) => (
                    <TraceJobCard key={job.id} job={job} />
                ))}
            </Stack>
        </Stack>
    );
}