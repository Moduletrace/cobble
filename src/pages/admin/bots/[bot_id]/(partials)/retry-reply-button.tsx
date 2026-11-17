import { useContext, useState } from "react";
import { RotateCw } from "lucide-react";
import type { BotMessageWithAttachments } from "@/src/types";
import { BotMessageActionsContext } from "../(data)/message-actions-context";
import retryBotReply from "../(functions)/retry-bot-reply";
import MessageActionButton from "./message-action-button";

type Props = {
    message: BotMessageWithAttachments;
};

/**
 * Queues the bot's reply again after one failed, shown on the failure
 * notice while it still needs the user. A refusal (a reply already on its
 * way, the message already answered) shows in the tooltip, the way the
 * stop button shows its own.
 */
export default function RetryReplyButton({ message }: Props) {
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
            setError(res.msg || `Couldn't retry the reply.`);
        }
    };

    return (
        <MessageActionButton
            title={error || `Retry this reply`}
            aria_label="Retry this reply"
            onClick={() => void retry()}
            disabled={retrying}
            loading={retrying}
        >
            <RotateCw size={14} aria-hidden />
        </MessageActionButton>
    );
}
