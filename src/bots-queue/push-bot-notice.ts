import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import type { BotFaceChange } from "@/src/functions/backend/db/bots/set-bot-face";
import pushBotUpdated from "./push-bot-updated";
import pushToSessionUser from "./push-to-session-user";

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
};

/**
 * Pushes a new bot message to the open tabs of the user whose
 * conversation it's in, and a face change to the user it's for
 * (`pushBotUpdated`). A relayed report
 * goes to the conversation it was posted in.
 */
export default async function pushBotNotice({ bot_id, message, bot, relay }: Params) {
    if (message) {
        await pushToSessionUser({
            session_id: message.session_id,
            data: { event: "server:bot-message", data: message },
        });
    }

    if (relay) {
        await pushToSessionUser({
            session_id: relay.message.session_id,
            data: { event: "server:bot-message", data: relay.message },
        });
    }

    if (bot) {
        await pushBotUpdated({ bot_id: bot.id || bot_id, user_id: bot.user_id });
    }
}
