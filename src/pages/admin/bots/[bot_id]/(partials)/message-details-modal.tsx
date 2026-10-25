import { useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Info } from "lucide-react";
import useMessageDetails from "../(hooks)/use-message-details";
import MessageActionButton from "./message-action-button";
import MessageDetailsBody from "./message-details-body";

type Props = {
    message_id: number;
};

/**
 * The info button under a bot message, and the modal it opens: which
 * provider and model generated it, the run behind it, and every model
 * call with its tokens and cost. Loaded when it opens.
 */
export default function MessageDetailsModal({ message_id }: Props) {
    const [open, set_open] = useState(false);
    const { details, loading, error } = useMessageDetails({ message_id, enabled: open });

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
            className="max-w-xl bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch">
                <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">Message details</H2>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    How this answer was generated: the provider and model behind it, the settings they were called with, and what it spent.
                </Span>
            </Stack>

            <Stack className="mt-4 max-h-[60vh] w-full gap-0! items-stretch overflow-y-auto">
                {details ? (
                    <MessageDetailsBody details={details} />
                ) : (
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                        {loading || !error ? "Loading details..." : error}
                    </Span>
                )}
            </Stack>
        </Modal>
    );
}
