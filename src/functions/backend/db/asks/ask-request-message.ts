import type { BUN_SQLITE_COBBLE_BOT_ASKS } from "@/db/types/db";
import botRef from "@/src/utils/bot-ref";

type Params = {
    ask: BUN_SQLITE_COBBLE_BOT_ASKS;
    requester_name: string;
    /**
     * The workspace the request came from, named so the answer knows its
     * place even though it runs in the bot's own chat.
     */
    place?: string | null;
};

/**
 * What the asked bot opens with: the brief another bot sent it, and what to
 * do with it. Stored on the user's side of the bot's own conversation, so
 * the run answers it and the model reads it as what the coordinator passed
 * on.
 */
export default function askRequestMessage({ ask, requester_name, place }: Params) {
    const requester = ask.requester_bot_id ? botRef({ id: ask.requester_bot_id }) : `"${requester_name}"`;
    const where = place ? `, from the ${place} workspace` : "";

    return `The coordinator passed on a request from ${requester} (ask #${ask.id}${where}):

> ${(ask.request || "").trim().replace(/\n/g, "\n> ")}

Answer it yourself, in this conversation. The answer goes back to the bot that asked, not to a user.`;
}
