import type {
    BUN_SQLITE_COBBLE_BOT_MESSAGES,
    BUN_SQLITE_COBBLE_BOTS,
} from "@/db/types/db";
import pushBotUpdated from "./push-bot-updated";
import pushToSessionUser from "./push-to-session-user";

type Params = {
    bot_id: number | string;
    message?: BUN_SQLITE_COBBLE_BOT_MESSAGES | null;
    bot?: Pick<BUN_SQLITE_COBBLE_BOTS, "id" | "face" | "status_line" | "computer_id"> | null;
    /**
     * A job's result reported to the bot that handed it over
     * (`relayJobToRequester`): a message in that bot's conversation.
     */
    relay?: { bot_id: number; message: BUN_SQLITE_COBBLE_BOT_MESSAGES } | null;
};

/**
 * Pushes a new bot message to the open tabs of the user whose
 * conversation it's in, and a face change to everyone who sees the bot
 * (`pushBotUpdated`, each with their own active task). A relayed report
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
        await pushBotUpdated({ bot: { ...bot, id: bot.id || Number(bot_id) } });
    }
}
