import type { BotWithLastMessage } from "@/src/types";
import {
    BotComputerBusyStatusLine,
    BotReplyJobTitle,
    BotWaitingStatusLine,
} from "@/src/dict/bot-queue-dict";

type Params = {
    bot: BotWithLastMessage;
    /**
     * The last message in the open thread is the user's, so a reply is due
     * here.
     */
    awaiting_reply?: boolean;
    /**
     * A message is still on its way to the server.
     */
    receiving?: boolean;
    /**
     * A task of the bot's is running.
     */
    has_task?: boolean;
};

export type BotBusyState = {
    /**
     * Waiting for a model to come back, or for the bot's computer.
     */
    waiting: boolean;
    /**
     * The user's message hasn't reached the server yet.
     */
    getting: boolean;
    /**
     * A reply is due in this thread.
     */
    thinking: boolean;
    /**
     * A task is running and the bot has the last word.
     */
    working: boolean;
    /**
     * Anything of the above, so the row has something to say.
     */
    busy: boolean;
    /**
     * There's work of the bot's to pull the plug on. A message still on
     * its way doesn't count: its reply is queued after it lands, so a stop
     * now would cancel nothing and be overtaken a moment later. The face
     * covers work in the user's other conversations too, since it's one
     * per user; `asleep` only counts on the two status lines the queue
     * sets while it waits, never a bot that's simply resting.
     */
    stoppable: boolean;
};

/**
 * What a bot is doing in a conversation, read from the thread and its face.
 * The thread decides the reply states: every user message queues one, so
 * while the user has the last word a reply is due here, even while the bot
 * works elsewhere. Only the waits (for a model, for its computer) come from
 * the face. The thinking row reads it for its line, and the conversation
 * reads it for the stop control.
 */
export default function botBusyState({
    bot,
    awaiting_reply,
    receiving,
    has_task,
}: Params): BotBusyState {
    const asleep = bot.face == "asleep";
    const waiting_model =
        asleep && bot.status_line == BotWaitingStatusLine && Boolean(awaiting_reply || has_task);
    const waiting_computer =
        asleep &&
        bot.status_line == BotComputerBusyStatusLine &&
        Boolean(has_task) &&
        !awaiting_reply;
    const waiting = waiting_model || waiting_computer;
    const getting = Boolean(receiving) && Boolean(awaiting_reply);
    const thinking = Boolean(awaiting_reply) && !waiting && !getting;
    const working =
        !awaiting_reply &&
        bot.face == "working" &&
        bot.status_line != BotReplyJobTitle &&
        Boolean(has_task);

    /**
     * Work runs here (a reply owed, a task of this thread's) or somewhere
     * else of this user's (the face says `working`, or `asleep` on a wait
     * line).
     */
    const stoppable =
        waiting ||
        thinking ||
        working ||
        bot.face == "working" ||
        (asleep &&
            (bot.status_line == BotWaitingStatusLine ||
                bot.status_line == BotComputerBusyStatusLine));

    return {
        waiting,
        getting,
        thinking,
        working,
        busy: getting || thinking || working || waiting,
        stoppable,
    };
}

