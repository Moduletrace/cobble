import { useContext } from "react";
import Row from "@moduletrace/twui/layout/Row";
import { Reply } from "lucide-react";
import type { BotMessageWithAttachments } from "@/src/types";
import { BotMessageActionsContext } from "../(data)/message-actions-context";
import MessageActionButton from "./message-action-button";
import MessageReactionPicker from "./message-reaction-picker";

type Props = {
    message: BotMessageWithAttachments;
};

/**
 * A message's reply and reaction actions, shown under it.
 */
export default function MessageActions({ message }: Props) {
    const { onReply, onReact } = useContext(BotMessageActionsContext);

    if (!message.id) return null;

    return (
        <Row className="gap-3! items-center">
            <MessageActionButton
                title="Reply"
                aria_label="Reply to this message"
                onClick={() => onReply({ message })}
            >
                <Reply size={14} aria-hidden />
            </MessageActionButton>
            <MessageReactionPicker message_id={message.id} onReact={onReact} />
        </Row>
    );
}
