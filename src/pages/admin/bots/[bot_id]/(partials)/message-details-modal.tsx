import { lazy, Suspense, useState } from "react";
import Divider from "@moduletrace/twui/layout/Divider";
import Modal from "@moduletrace/twui/elements/Modal";
import H2 from "@moduletrace/twui/layout/H2";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Spacer from "@moduletrace/twui/layout/Spacer";
import Stack from "@moduletrace/twui/layout/Stack";
import { Info } from "lucide-react";
import useMessageDetails from "../(hooks)/use-message-details";
import CopyMessageDetailsButton from "./copy-message-details-button";
import MessageActionButton from "./message-action-button";
import MessageDetailsBody from "./message-details-body";
import MessageDetailsTabButton from "./message-details-tab-button";

/**
 * Only the modal's second tab needs the logs, and only once it's opened, so
 * it loads as its own chunk rather than with the conversation.
 */
const MessageDebugLogs = lazy(() => import("./message-debug-logs"));

type Props = {
    message_id: number;
    /**
     * Its `tool_log`: what the run behind it did, shown in the modal and
     * passed along to the copied report.
     */
    tool_log?: string | null;
    /**
     * Set when the message was posted in a chatroom, so its details are read
     * from the room's route.
     */
    chatroom_id?: number;
};

/**
 * The info button under a bot message (in a conversation or a chatroom),
 * and the modal it opens: which provider and model generated it, the run
 * behind it, what its tools did, and every model call with its tokens and
 * cost - then, under "Debug logs", what the run did step by step (its
 * turns and what it reasoned, every tool call with its arguments and
 * answer), which is read only when that tab is opened.
 */
export default function MessageDetailsModal({ message_id, tool_log, chatroom_id }: Props) {
    const [open, set_open] = useState(false);
    const [tab, set_tab] = useState<"details" | "debug">("details");
    const { details, loading, error } = useMessageDetails({ message_id, enabled: open, chatroom_id });

    return (
        <Modal
            target={
                <MessageActionButton title="Details" aria_label="How this message was generated">
                    <Info size={14} aria-hidden />
                </MessageActionButton>
            }
            targetWrapperProps={{ className: "shrink-0" }}
            open={open}
            setOpen={set_open}
            className="max-w-2xl bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch">
                <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">Message details</H2>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    How this answer was generated: the provider and model behind it, the settings they were called with,
                    what it spent, and what its run did step by step.
                </Span>
            </Stack>

            <Row className="mt-4 w-full gap-2! flex-nowrap items-center">
                <Row className="gap-0.5! p-0.5 flex-nowrap items-center rounded-default border border-solid border-hairline">
                    <MessageDetailsTabButton
                        label="Details"
                        selected={tab == "details"}
                        onSelect={() => set_tab("details")}
                    />
                    <MessageDetailsTabButton
                        label="Debug logs"
                        selected={tab == "debug"}
                        onSelect={() => set_tab("debug")}
                    />
                </Row>
                <Spacer />
            </Row>

            <Divider className="mt-3 w-full border-hairline dark:border-hairline" />

            <Stack className="mt-3 max-h-[60vh] w-full gap-0! items-stretch overflow-y-auto">
                {tab == "details" ? (
                    <Stack className="w-full gap-3! items-stretch">
                        <Row className="w-full flex-nowrap items-center justify-end">
                            <CopyMessageDetailsButton message_id={message_id} chatroom_id={chatroom_id} />
                        </Row>
                        {details ? (
                            <MessageDetailsBody details={details} tool_log={tool_log} />
                        ) : (
                            <Span className="text-[13px] leading-[18px] text-ink-secondary">
                                {loading || !error ? "Loading details..." : error}
                            </Span>
                        )}
                    </Stack>
                ) : (
                    <Suspense fallback={null}>
                        <MessageDebugLogs message_id={message_id} chatroom_id={chatroom_id} />
                    </Suspense>
                )}
            </Stack>
        </Modal>
    );
}