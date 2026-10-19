import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotHue } from "@/src/dict/bot-dict";
import {
    BotComputerBusyStatusLine,
    BotReplyJobTitle,
    BotWaitingStatusLine,
} from "@/src/dict/bot-queue-dict";
import type { BotWithLastMessage } from "@/src/types";

type Props = {
    bot: BotWithLastMessage;
    /**
     * The latest step of the bot's active task.
     */
    progress?: string | null;
    /**
     * The latest step of the reply running in this conversation.
     */
    reply_progress?: string | null;
    /**
     * The thread's last message is the user's, so a reply is due here.
     */
    awaiting_reply?: boolean;
    /**
     * This session has an active task.
     */
    has_task?: boolean;
};

/**
 * Under the last message while the bot is working on a reply or a task
 * (or waiting for a model or its computer), so slow work doesn't look like
 * none. A task or a reply shows its latest step. The bot's face is one per user,
 * shared by all their sessions with it, so a reply shows from the thread
 * alone: every user message queues one, so while the user has the last
 * word a reply is due here, even while the bot works elsewhere. Only the
 * waits (for a model, for its computer) come from the face.
 */
export default function BotThinkingRow({ bot, progress, reply_progress, awaiting_reply, has_task }: Props) {
    const name = bot.name || "The bot";
    const asleep = bot.face == "asleep";
    const waiting_model = asleep && bot.status_line == BotWaitingStatusLine && Boolean(awaiting_reply || has_task);
    const waiting_computer =
        asleep && bot.status_line == BotComputerBusyStatusLine && Boolean(has_task) && !awaiting_reply;
    const waiting = waiting_model || waiting_computer;
    const thinking = Boolean(awaiting_reply) && !waiting;
    const working =
        !awaiting_reply && bot.face == "working" && bot.status_line != BotReplyJobTitle && Boolean(has_task);

    if (!thinking && !working && !waiting) return null;

    const label = thinking
        ? `${name} is thinking…`
        : working
          ? `${name} is working…`
          : `${bot.status_line}…`;
    const detail = working ? progress : thinking ? reply_progress : null;

    return (
        <Row role="status" className="w-full gap-3! flex-nowrap items-center">
            <BotAvatar
                image_media_id={bot.image_media_id}
                hue={(bot.hue || null) as BotHue | null}
                face={waiting ? "asleep" : "working"}
                size={28}
            />
            <Stack className="min-w-0 gap-0! items-start">
                <Span className="text-sm leading-5 text-ink-secondary animate-pulse motion-reduce:animate-none">
                    {label}
                </Span>
                {detail ? (
                    <Span className="w-full text-xs leading-4 text-ink-secondary truncate">
                        {detail}
                    </Span>
                ) : null}
            </Stack>
        </Row>
    );
}
