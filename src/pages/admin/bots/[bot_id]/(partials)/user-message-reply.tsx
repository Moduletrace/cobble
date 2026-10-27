import { useContext } from "react";
import { Reply } from "lucide-react";
import type { BotMessageWithAttachments } from "@/src/types";
import { BotMessageActionsContext } from "../(data)/message-actions-context";
import MessageActionButton from "./message-action-button";

type Props = {
    message: BotMessageWithAttachments;
};

/**
 * Reply to one of the user's own messages, beside its copy button. A
 * message still on its way has only a temporary (negative) id, so it gets
 * no button until the saved one replaces it.
 */
export default function UserMessageReply({ message }: Props) {
    const { onReply } = useContext(BotMessageActionsContext);

    if (!(Number(message.id) > 0)) return null;

    return (
        <MessageActionButton
            title="Reply"
            aria_label="Reply to this message"
            onClick={() => onReply({ message })}
        >
            <Reply size={14} aria-hidden />
        </MessageActionButton>
    );
}
