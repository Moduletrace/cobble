import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { BotConversationRequest } from "@/src/schemas/bot-schema";
import type { ConversationHistoryPayload } from "@/src/types";

/**
 * A conversation's history, loaded once the page is on screen.
 */
export default async function fetchConversationHistory({
    bot_id,
    workspace_id,
}: BotConversationRequest) {
    return await fetchApi<
        BotConversationRequest,
        APIResponseObject<ConversationHistoryPayload>
    >(`/api/admin/bots/conversation-history`, {
        method: "POST",
        body: { bot_id, workspace_id },
    });
}
