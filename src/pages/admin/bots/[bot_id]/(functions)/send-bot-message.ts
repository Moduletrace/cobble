import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { SendBotMessageRequest } from "@/src/schemas/bot-schema";
import type { BotMessageWithAttachments } from "@/src/types";

export default async function sendBotMessage({
    bot_id,
    workspace_id,
    text,
    media_ids,
}: SendBotMessageRequest) {
    return await fetchApi<
        SendBotMessageRequest,
        APIResponseObject<BotMessageWithAttachments>
    >(`/api/admin/bots/send-message`, {
        method: "POST",
        body: { bot_id, workspace_id, text, media_ids },
    });
}
