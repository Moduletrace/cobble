import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotHue } from "@/src/dict/bot-dict";
import { BotReplyJobTitle, BotWaitingStatusLine } from "@/src/dict/bot-queue-dict";
import type { BotWithLastMessage } from "@/src/types";

type Props = {
    bot: BotWithLastMessage;
    /**
     * The latest step of the bot's active task.
     */
    progress?: string | null;
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
 * (or waiting for a model to come back), so slow work doesn't look like
 * none. A task shows its latest step. The bot's face is shared by
 * everyone who sees it, so the row only shows for work in this
 * conversation: a reply while the user has the last word, or its own
 * task.
 */
export default function BotThinkingRow({ bot, progress, awaiting_reply, has_task }: Props) {
    const name = bot.name || "The bot";
    const thinking = bot.face == "working" && bot.status_line == BotReplyJobTitle && Boolean(awaiting_reply);
    const working = bot.face == "working" && bot.status_line != BotReplyJobTitle && Boolean(has_task);
    const waiting = bot.face == "asleep" && bot.status_line == BotWaitingStatusLine && Boolean(awaiting_reply || has_task);

    if (!thinking && !working && !waiting) return null;

    const label = thinking
        ? `${name} is thinking…`
        : working
          ? `${name} is working…`
          : `${BotWaitingStatusLine}…`;
    const detail = working ? progress : null;

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
