import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import type { BotFaceChange } from "@/src/functions/backend/db/bots/set-bot-face";
import { logError } from "@/src/functions/backend/logger";
import notifyBotMessage from "@/src/push/notify-bot-message";
import notifyBotFace from "@/src/push/notify-bot-face";
import pushBotUpdated from "./push-bot-updated";
import pushToSessionUser from "./push-to-session-user";
import grabSessionChatroomId from "@/src/functions/backend/db/chatrooms/grab-session-chatroom-id";
import pushChatroomMessage from "@/src/functions/backend/db/chatrooms/push-chatroom-message";

type Params = {
    bot_id: number | string;
    message?: BUN_SQLITE_COBBLE_BOT_MESSAGES | null;
    /**
     * A face change (`setBotFace`), pushed to the user it's for.
     */
    bot?: BotFaceChange | null;
    /**
     * A job's result reported to the bot that handed it over
     * (`relayJobToRequester`): a message in that bot's conversation.
     */
    relay?: { bot_id: number; message: BUN_SQLITE_COBBLE_BOT_MESSAGES } | null;
    /**
     * Skip the push notification, keeping only the live send. For a message
     * the user just caused themselves (stopping the bot): they are looking
     * at the app, and one notification per conversation would be noise.
     */
    quiet_push?: boolean;
};

/**
 * Pushes a new bot message to the open tabs of the user whose
 * conversation it's in, and a face change to the user it's for
 * (`pushBotUpdated`). A relayed report
 * goes to the conversation it was posted in, and a chatroom's message to
 * the room (`pushChatroomMessage`). Best effort: a push that
 * fails is logged and never fails the job that made the change.
 */
export default async function pushBotNotice({ bot_id, message, bot, relay, quiet_push }: Params) {
    try {
        await push({ bot_id, message, bot, relay, quiet_push });
    } catch (error) {
        await logError({
            title: "Bot notice wasn't pushed",
            error,
            metadata: { bot_id, message_id: message?.id || null },
        }).catch(() => {});
    }
}

async function push({ bot_id, message, bot, relay, quiet_push }: Params) {
    /**
     * A message in a chatroom goes to the room, never to a conversation,
     * and never as a notification: rooms are records.
     */
    const room_id = message ? await grabSessionChatroomId({ session_id: message.session_id }) : null;

    if (message && room_id) {
        await pushChatroomMessage({ chatroom_id: room_id, message });
    } else if (message) {
        await pushToSessionUser({
            session_id: message.session_id,
            data: { event: "server:bot-message", data: message },
        });

        /**
         * Not waited on: a push service's latency must not slow the job.
         */
        if (!quiet_push) void notifyBotMessage({ message });
    }

    if (relay) {
        await pushToSessionUser({
            session_id: relay.message.session_id,
            data: { event: "server:bot-message", data: relay.message },
        });

        if (!quiet_push) void notifyBotMessage({ message: relay.message });
    }

    if (bot) {
        await pushBotUpdated({ bot_id: bot.id || bot_id, user_id: bot.user_id });

        /**
         * A message that carries needs-you already notified; this is the
         * face-only case (a task running into something only the user
         * can solve).
         */
        if (!message && bot.face == "needs-you") {
            void notifyBotFace({ bot });
        }
    }
}
