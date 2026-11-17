import { useContext, useState } from "react";
import { RotateCw } from "lucide-react";
import type { BotMessageWithAttachments } from "@/src/types";
import { BotMessageActionsContext } from "../(data)/message-actions-context";
import retryBotReply from "../(functions)/retry-bot-reply";
import MessageActionButton from "./message-action-button";

type Props = {
    message: BotMessageWithAttachments;
    /**
     * What the action says it does, on its tooltip and to a screen reader.
     */
    title?: string;
    /**
     * What a refusal or a failure says when the route sends no reason.
     */
    failed_text?: string;
};

/**
 * Queues the bot's reply again: on the failure notice while it still needs
 * the user (Retry), and on the bot's last word in the conversation whatever
 * it was (Run again), which answers the newest user message afresh. A
 * refusal (a reply already on its way, the message already answered) shows
 * in the tooltip, the way the stop button shows its own.
 */
export default function RetryReplyButton({
    message,
    title = `Retry this reply`,
    failed_text = `Couldn't retry the reply.`,
}: Props) {
    const { onRetry } = useContext(BotMessageActionsContext);
    const [retrying, setRetrying] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const retry = async () => {
        setRetrying(true);
        setError(null);

        const res = await retryBotReply({ message_id: Number(message.id) });

        setRetrying(false);

        if (res.success) {
            onRetry({ message });
        } else {
            setError(res.msg || failed_text);
        }
    };

    return (
        <MessageActionButton
            title={error || title}
            aria_label={title}
            onClick={() => void retry()}
            disabled={retrying}
            loading={retrying}
        >
            <RotateCw size={14} aria-hidden />
        </MessageActionButton>
    );
}
