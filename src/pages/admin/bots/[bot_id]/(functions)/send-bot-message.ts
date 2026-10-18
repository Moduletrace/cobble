import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { BUN_SQLITE_COBBLE_BOT_MESSAGES } from "@/db/types/db";
import type { SendBotMessageRequest } from "@/src/schemas/bot-schema";

export default async function sendBotMessage({
    bot_id,
    text,
}: SendBotMessageRequest) {
    return await fetchApi<
        SendBotMessageRequest,
        APIResponseObject<BUN_SQLITE_COBBLE_BOT_MESSAGES>
    >(`/api/admin/bots/send-message`, {
        method: "POST",
        body: { bot_id, text },
    });
}
