import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { BotConversationRequest } from "@/src/schemas/bot-schema";
import type { BotStoppedPayload } from "@/src/types";

/**
 * Pulls the plug on the bot for the signed-in user: every job of it that's
 * queued or running stops, wherever they chat with it. The messages that
 * end the wait arrive over the WebSocket, so nothing here reloads.
 */
export default async function stopBot({ bot_id, workspace_id }: BotConversationRequest) {
    return await fetchApi<
        BotConversationRequest,
        APIResponseObject<BotStoppedPayload>
    >(`/api/admin/bots/stop`, {
        method: "POST",
        body: { bot_id, workspace_id },
    });
}
