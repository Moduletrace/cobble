import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { twMerge } from "tailwind-merge";
import { Bug } from "lucide-react";
import BotAvatar from "@/src/components/general/bot-avatar";
import botStoneProps from "@/src/utils/bot-stone-props";
import { BotGettingMessageStatusLine } from "@/src/dict/bot-queue-dict";
import type { BotWithLastMessage } from "@/src/types";
import botBusyState from "../(utils)/bot-busy-state";
import StopBotButton from "./stop-bot-button";
import TracePanel from "./trace-panel";

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
     * The user's last message is still on its way to the server, so the bot
     * hasn't got it yet.
     */
    receiving?: boolean;
    /**
     * This session has an active task.
     */
    has_task?: boolean;
    /**
     * The session's id: the debug logs read the run it's working on.
     */
    session_id?: number | null;
    /**
     * The debug logs are open under the row. The conversation keeps that,
     * remembered per user.
     */
    debug_open?: boolean;
    /**
     * Shows or hides the debug logs under the row.
     */
    on_toggle_debug?: () => void;
};

/**
 * Under the last message while the bot is getting a just-sent message,
 * working on a reply or a task (or waiting for a model or its computer), so
 * slow work doesn't look like none. A task or a reply shows its latest step.
 * The bot's face is one per user, shared by all their sessions with it, so a
 * reply shows from the thread alone: every user message queues one, so while
 * the user has the last word a reply is due here, even while the bot works
 * elsewhere. Only the waits (for a model, for its computer) come from the
 * face. While it shows, a stop button pulls the plug on the bot's work, and
 * a bug button opens the run's debug logs under it (`TracePanel`).
 */
export default function BotThinkingRow({
    bot,
    progress,
    reply_progress,
    awaiting_reply,
    receiving,
    has_task,
    session_id,
    debug_open,
    on_toggle_debug,
}: Props) {
    const name = bot.name || "The bot";
    const { waiting, getting, thinking, working, busy, stoppable } = botBusyState({
        bot,
        awaiting_reply,
        receiving,
        has_task,
    });

    if (!busy) return null;

    const label = getting
        ? `${name} is ${BotGettingMessageStatusLine.toLowerCase()}…`
        : thinking
          ? `${name} is thinking…`
          : working
            ? `${name} is working…`
            : `${bot.status_line}…`;
    const detail = working ? progress : thinking ? reply_progress : null;

    return (
        <Stack className="w-full gap-0! items-stretch">
            <Row role="status" className="w-full gap-3! flex-nowrap items-center">
                <BotAvatar
                    image_media_id={bot.image_media_id}
                    {...botStoneProps({ color: bot.color, stone: bot.stone, hue: bot.hue })}
                    face={waiting ? "asleep" : "working"}
                    size={28}
                />
                <Stack className="min-w-0 grow gap-0! items-start">
                    <Span className="text-sm leading-5 text-ink-secondary animate-pulse motion-reduce:animate-none">
                        {label}
                    </Span>
                    {detail ? (
                        <Span className="w-full text-xs leading-4 text-ink-secondary truncate">
                            {detail}
                        </Span>
                    ) : null}
                </Stack>
                {on_toggle_debug ? (
                    <Button
                        title={debug_open ? "Hide the debug logs" : "Show the debug logs"}
                        aria-label={debug_open ? "Hide the debug logs" : "Show the debug logs"}
                        aria-pressed={Boolean(debug_open)}
                        type="button"
                        variant="ghost"
                        color="text"
                        size="smaller"
                        onClick={on_toggle_debug}
                        className={twMerge(
                            "shrink-0 p-1! text-ink-secondary dark:text-ink-secondary hover:text-ink hover:dark:text-ink hover:bg-sunken hover:dark:bg-sunken rounded-default transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink",
                            debug_open && "bg-sunken text-ink dark:text-ink",
                        )}
                    >
                        <Bug size={14} aria-hidden />
                    </Button>
                ) : null}
                <StopBotButton bot_name={bot.name} disabled={!stoppable} />
            </Row>
            {debug_open && on_toggle_debug ? (
                <TracePanel session_id={session_id} open={Boolean(debug_open)} />
            ) : null}
        </Stack>
    );
}