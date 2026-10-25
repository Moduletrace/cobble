import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { BotConversationRequest } from "@/src/schemas/bot-schema";
import type { ConversationExport } from "@/src/types";

/**
 * The conversation's active session, for "Copy chat".
 */
export default async function fetchConversationExport({
    bot_id,
    workspace_id,
}: BotConversationRequest) {
    return await fetchApi<
        BotConversationRequest,
        APIResponseObject<ConversationExport>
    >(`/api/admin/bots/conversation-export`, {
        method: "POST",
        body: { bot_id, workspace_id },
    });
}
