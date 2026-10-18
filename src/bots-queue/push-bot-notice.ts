import type {
    BUN_SQLITE_COBBLE_BOT_MESSAGES,
    BUN_SQLITE_COBBLE_BOTS,
} from "@/db/types/db";
import pushToBotOwner from "./push-to-bot-owner";

type Params = {
    bot_id: number | string;
    message?: BUN_SQLITE_COBBLE_BOT_MESSAGES | null;
    bot?: Pick<BUN_SQLITE_COBBLE_BOTS, "id" | "face" | "status_line"> | null;
};

/**
 * Pushes a new bot message and/or face change to the owner's open tabs.
 */
export default async function pushBotNotice({ bot_id, message, bot }: Params) {
    if (message) {
        await pushToBotOwner({
            bot_id,
            data: { event: "server:bot-message", data: message },
        });
    }

    if (bot) {
        await pushToBotOwner({
            bot_id,
            data: { event: "server:bot-updated", data: bot },
        });
    }
}
