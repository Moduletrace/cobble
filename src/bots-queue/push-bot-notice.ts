import type {
    BUN_SQLITE_COBBLE_BOT_MESSAGES,
    BUN_SQLITE_COBBLE_BOTS,
} from "@/db/types/db";
import grabActiveBotTask from "@/src/functions/backend/db/bots/grab-active-bot-task";
import pushToBotOwner from "./push-to-bot-owner";

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
 * Pushes a new bot message and/or face change to the owner's open tabs.
 * A face change carries the bot's active task, for the working-on panel.
 * A relayed report goes to the conversation it was posted in.
 */
export default async function pushBotNotice({ bot_id, message, bot, relay }: Params) {
    if (message) {
        await pushToBotOwner({
            bot_id,
            data: { event: "server:bot-message", data: message },
        });
    }

    if (relay) {
        await pushToBotOwner({
            bot_id: relay.bot_id,
            data: { event: "server:bot-message", data: relay.message },
        });
    }

    if (bot) {
        await pushToBotOwner({
            bot_id,
            data: {
                event: "server:bot-updated",
                data: { ...bot, task: await grabActiveBotTask({ bot_id }) },
            },
        });
    }
}
