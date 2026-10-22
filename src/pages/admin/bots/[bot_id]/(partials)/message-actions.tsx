import { useContext } from "react";
import Row from "@moduletrace/twui/layout/Row";
import { Reply } from "lucide-react";
import type { BotMessageWithAttachments } from "@/src/types";
import { BotMessageActionsContext } from "../(data)/message-actions-context";
import CopyMessageButton from "./copy-message-button";
import MessageActionButton from "./message-action-button";
import MessageReactionPicker from "./message-reaction-picker";

type Props = {
    message: BotMessageWithAttachments;
};

/**
 * A message's copy, reply and reaction actions, shown under it. A message
 * still on its way to the server has no id yet, so it can only be copied.
 */
export default function MessageActions({ message }: Props) {
    const { onReply, onReact } = useContext(BotMessageActionsContext);

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
                    <MessageReactionPicker
                        message_id={message.id}
                        onReact={onReact}
                    />
                </>
            ) : null}
        </Row>
    );
}
