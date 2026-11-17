import { useContext } from "react";
import Row from "@moduletrace/twui/layout/Row";
import { Reply } from "lucide-react";
import type { BotMessageWithAttachments } from "@/src/types";
import { BotMessageActionsContext } from "../(data)/message-actions-context";
import CopyMessageButton from "./copy-message-button";
import MessageActionButton from "./message-action-button";
import MessageDetailsModal from "./message-details-modal";
import MessageReactionPicker from "./message-reaction-picker";
import RetryReplyButton from "./retry-reply-button";

type Props = {
    message: BotMessageWithAttachments;
    /**
     * This is the bot's last word in the conversation: it can be run again,
     * whatever it was (an answer, a stopped run's notice).
     */
    rerun?: boolean;
};

/**
 * A message's copy, reply, reaction and details actions, shown under it. A
 * failed reply still needing the user offers Retry beside Reply, and
 * otherwise the bot's last reply offers Run again (the same action, worded
 * for a reply that went through or was stopped).
 */
export default function MessageActions({ message, rerun }: Props) {
    const { onReply, onReact } = useContext(BotMessageActionsContext);
    const failed_reply =
        message.author == "bot" &&
        message.failed_job_kind == "reply" &&
        Boolean(message.needs_you);

    if (!message.id && !message.text?.trim()) return null;

    return (
        <Row className="gap-3! items-center">
            <CopyMessageButton text={message.text || ""} />
            {message.id ? (
                <>
                    <MessageActionButton
                        title="Reply"
                        aria_label="Reply to this message"
                        onClick={() => onReply({ message })}
                    >
                        <Reply size={14} aria-hidden />
                    </MessageActionButton>
                    {failed_reply ? (
                        <RetryReplyButton message={message} />
                    ) : message.author == "bot" && rerun ? (
                        <RetryReplyButton
                            message={message}
                            title="Run this reply again"
                            failed_text="Couldn't run that reply again."
                        />
                    ) : null}
                    <MessageReactionPicker
                        message_id={message.id}
                        onReact={onReact}
                    />
                    {message.author == "bot" ? (
                        <MessageDetailsModal message_id={Number(message.id)} tool_log={message.tool_log} />
                    ) : null}
                </>
            ) : null}
        </Row>
    );
}
