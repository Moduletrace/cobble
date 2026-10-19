import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { ReactToBotMessageRequest } from "@/src/schemas/bot-schema";
import type { BotMessageReactionData } from "@/src/types";

/**
 * Adds or takes back an emoji reaction on a message, returning the
 * message's fresh reactions.
 */
export default async function reactToBotMessage({ message_id, emoji }: ReactToBotMessageRequest) {
    return await fetchApi<
        ReactToBotMessageRequest,
        APIResponseObject<BotMessageReactionData>
    >(`/api/admin/bots/react-message`, {
        method: "POST",
        body: { message_id, emoji },
    });
}
