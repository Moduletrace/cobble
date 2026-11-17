import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { useContext, useState } from "react";
import { RotateCw } from "lucide-react";
import BotAvatar from "@/src/components/general/bot-avatar";
import botStoneProps from "@/src/utils/bot-stone-props";
import type { BotMessageWithAttachments, BotWithLastMessage } from "@/src/types";
import { BotMessageActionsContext } from "../(data)/message-actions-context";
import retryBotReply from "../(functions)/retry-bot-reply";

type Props = {
    bot: BotWithLastMessage;
    /**
     * The user's message the thread ends on, with nothing on its way.
     */
    message: BotMessageWithAttachments;
};

/**
 * Under the user's last message when no answer is coming: a run that was
 * stopped, or one that ended without a word, leaves their message last with
 * nothing on its way. Says so rather than leaving the thread looking like
 * the bot is still thinking, and offers to answer it again (the same run
 * again the bot's own last word offers).
 */
export default function UnansweredReplyRow({ bot, message }: Props) {
    const { onRetry } = useContext(BotMessageActionsContext);
    const [running, setRunning] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const run_again = async () => {
        setRunning(true);
        setError(null);

        const res = await retryBotReply({ message_id: Number(message.id) });

        setRunning(false);

        if (res.success) {
            onRetry({ message });
        } else {
            setError(res.msg || `Couldn't run that reply again.`);
        }
    };

    return (
        <Row role="status" className="w-full gap-3! flex-nowrap items-center">
            <BotAvatar
                image_media_id={bot.image_media_id}
                {...botStoneProps({ color: bot.color, stone: bot.stone, hue: bot.hue })}
                face={bot.face}
                size={28}
            />
            <Stack className="min-w-0 grow gap-0! items-start">
                <Span className="text-sm leading-5 text-ink-secondary">
                    {error || "No answer came."}
                </Span>
            </Stack>
            <Button
                title="Answer this message again"
                type="button"
                size="smaller"
                variant="ghost"
                color="text"
                onClick={() => void run_again()}
                disabled={running}
                loading={running}
                loadingIconSize="small"
                className="shrink-0 gap-1! px-2! text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken rounded-default transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink"
            >
                <RotateCw size={12} aria-hidden />
                Run it again
            </Button>
        </Row>
    );
}